import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import { CreateApiKeyDto, ApiKeyResponseDto, RevokeApiKeyDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly secretKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('API_KEY_SECRET') || 'change-me-in-production';
  }

  /**
   * Create a new API key
   */
  async createApiKey(
    dto: CreateApiKeyDto,
    userId: string,
    organizationId?: string,
  ): Promise<ApiKeyResponseDto> {
    const operation = `Create API key: ${dto.name}`;
    this.logger.log(`[${operation}] By user ${userId}`);

    try {
      // Generate API key
      const keyId = randomBytes(16).toString('hex');
      const keySecret = randomBytes(32).toString('hex');
      const fullKey = `mec_${keyId}_${keySecret}`;
      const keyPrefix = `mec_${keyId.substring(0, 8)}...`;

      // Hash the key for storage
      const hashedKey = this.hashApiKey(fullKey);

      // Create API key record
      const apiKey = await this.prisma.apiKey.create({
        data: {
          name: dto.name,
          keyHash: hashedKey,
          keyPrefix: keyPrefix,
          userId,
          organizationId: organizationId || null,
          rateLimitPerMinute: dto.rateLimitPerMinute || 60,
          allowedIps: dto.allowedIps || [],
          scopes: dto.scopes || ['read', 'write'],
          isActive: true,
        },
      });

      this.logger.log(`[${operation}] API key created: ${apiKey.id}`);

      return {
        id: apiKey.id,
        name: apiKey.name,
        key: fullKey, // Only shown once
        keyPrefix: apiKey.keyPrefix,
        isActive: apiKey.isActive,
        rateLimitPerMinute: apiKey.rateLimitPerMinute,
        allowedIps: apiKey.allowedIps as string[],
        scopes: apiKey.scopes as string[],
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt || undefined,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create API key');
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string, ipAddress?: string): Promise<{
    userId: string;
    organizationId?: string;
    scopes: string[];
    rateLimit: number;
  }> {
    const operation = 'Validate API key';
    this.logger.log(`[${operation}]`);

    try {
      // Extract key ID from format: mec_{keyId}_{secret}
      const parts = apiKey.split('_');
      if (parts.length !== 3 || parts[0] !== 'mec') {
        throw new UnauthorizedException('Invalid API key format');
      }

      const keyId = parts[1];

      // Find API key by prefix
      const apiKeyRecord = await this.prisma.apiKey.findFirst({
        where: {
          keyPrefix: { startsWith: `mec_${keyId.substring(0, 8)}` },
          isActive: true,
        },
      });

      if (!apiKeyRecord) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Verify key hash
      const hashedKey = this.hashApiKey(apiKey);
      if (hashedKey !== apiKeyRecord.keyHash) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Check IP whitelist
      if (apiKeyRecord.allowedIps && (apiKeyRecord.allowedIps as string[]).length > 0) {
        if (!ipAddress || !(apiKeyRecord.allowedIps as string[]).includes(ipAddress)) {
          throw new UnauthorizedException('IP address not allowed');
        }
      }

      // Update last used
      await this.prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: apiKeyRecord.userId,
        organizationId: apiKeyRecord.organizationId || undefined,
        scopes: apiKeyRecord.scopes as string[],
        rateLimit: apiKeyRecord.rateLimitPerMinute,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('API key validation failed');
    }
  }

  /**
   * List API keys for user/organization
   */
  async listApiKeys(userId: string, organizationId?: string): Promise<ApiKeyResponseDto[]> {
    const operation = 'List API keys';
    this.logger.log(`[${operation}]`);

    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: {
          userId,
          organizationId: organizationId || null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        key: '***', // Never show full key
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        rateLimitPerMinute: key.rateLimitPerMinute,
        allowedIps: key.allowedIps as string[],
        scopes: key.scopes as string[],
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt || undefined,
      }));
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to list API keys');
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(apiKeyId: string, userId: string, dto?: RevokeApiKeyDto): Promise<void> {
    const operation = `Revoke API key ${apiKeyId}`;
    this.logger.log(`[${operation}]`);

    try {
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      if (!apiKey) {
        throw new NotFoundException('API key not found');
      }

      if (apiKey.userId !== userId) {
        throw new UnauthorizedException('You can only revoke your own API keys');
      }

      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: dto?.reason,
        },
      });

      this.logger.log(`[${operation}] API key revoked`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to revoke API key');
    }
  }

  private hashApiKey(apiKey: string): string {
    return createHmac('sha256', this.secretKey).update(apiKey).digest('hex');
  }
}
