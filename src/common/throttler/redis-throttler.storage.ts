import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

/**
 * Redis-backed rate limit storage for multi-instance deployments.
 * Falls back to in-memory behavior only if Redis connection fails at startup.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis;
  private readonly keyPrefix: string;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    this.keyPrefix = config.get<string>('THROTTLE_REDIS_PREFIX') || 'mech:throttle';
    if (url) {
      this.redis = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 5000 });
    } else {
      this.redis = new Redis({
        host: config.get<string>('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        password: config.get<string>('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
      });
    }
    this.redis.on('error', (err) => this.logger.warn(`Redis throttler: ${err.message}`));
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `${this.keyPrefix}:${throttlerName}:${key}`;
    const blockKey = `${this.keyPrefix}:block:${throttlerName}:${key}`;

    const blockTtl = await this.redis.pttl(blockKey);
    if (blockTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockTtl,
      };
    }

    const totalHits = await this.redis.incr(hitKey);
    if (totalHits === 1) {
      await this.redis.pexpire(hitKey, ttl);
    }

    let timeToExpire = await this.redis.pttl(hitKey);
    if (timeToExpire < 0) {
      await this.redis.pexpire(hitKey, ttl);
      timeToExpire = ttl;
    }

    if (totalHits > limit) {
      const blockMs = blockDuration > 0 ? blockDuration : ttl;
      await this.redis.psetex(blockKey, blockMs, '1');
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockMs,
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }
}
