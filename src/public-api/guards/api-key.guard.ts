import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler());

    // Extract API key from header
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      // Validate API key
      const validation = await this.apiKeyService.validateApiKey(
        apiKey,
        request.ip || request.connection?.remoteAddress,
      );

      // Check scopes if required
      if (requiredScopes && requiredScopes.length > 0) {
        const hasScope = requiredScopes.some((scope) => validation.scopes.includes(scope));
        if (!hasScope) {
          throw new UnauthorizedException(`Required scope: ${requiredScopes.join(', ')}`);
        }
      }

      // Attach user info to request
      request.apiKey = {
        userId: validation.userId,
        organizationId: validation.organizationId,
        scopes: validation.scopes,
        rateLimit: validation.rateLimit,
      };

      return true;
    } catch (error) {
      this.logger.warn(`API key validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
