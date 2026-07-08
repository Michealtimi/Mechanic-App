import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import Redis from 'ioredis';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  redis: 'up' | 'down' | 'skipped';
  timestamp: string;
}

const RETRY_AFTER_SECONDS = 60;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getRedisClient(): Redis | null {
    if (this.redis) return this.redis;
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      this.redis = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
      return this.redis;
    }
    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<number>('REDIS_PORT', 6379);
    const password = this.config.get<string>('REDIS_PASSWORD');
    this.redis = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    return this.redis;
  }

  async check(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    let database: 'up' | 'down' = 'down';
    let redis: 'up' | 'down' | 'skipped' = 'skipped';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch (err) {
      this.logger.error('Health check failed: database unreachable', (err as Error).stack);
    }

    if (this.config.get<string>('NODE_ENV') === 'production') {
      try {
        const client = this.getRedisClient();
        if (client) {
          const pong = await client.ping();
          redis = pong === 'PONG' ? 'up' : 'down';
        }
      } catch (err) {
        this.logger.error('Health check failed: redis unreachable', (err as Error).stack);
        redis = 'down';
      }
    }

    const status =
      database === 'up' && (redis === 'up' || redis === 'skipped') ? 'ok' : 'degraded';

    return { status, database, redis, timestamp };
  }

  async assertHealthy(): Promise<void> {
    const result = await this.check();
    if (result.status === 'degraded') {
      throw new ServiceUnavailableException(
        { statusCode: 503, message: 'Service temporarily unavailable' },
        { description: `Retry-After: ${RETRY_AFTER_SECONDS}` },
      );
    }
  }

  getRetryAfterSeconds(): number {
    return RETRY_AFTER_SECONDS;
  }
}
