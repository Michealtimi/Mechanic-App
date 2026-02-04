import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  timestamp: string;
}

const RETRY_AFTER_SECONDS = 60;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    let database: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch (err) {
      this.logger.error('Health check failed: database unreachable', (err as Error).stack);
    }

    const status = database === 'up' ? 'ok' : 'degraded';
    return { status, database, timestamp };
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
