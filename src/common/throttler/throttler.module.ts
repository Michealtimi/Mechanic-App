import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisThrottlerStorage } from './redis-throttler.storage';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, RedisThrottlerStorage],
      useFactory: (config: ConfigService, storage: RedisThrottlerStorage) => ({
        storage,
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL_MS', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 20),
          },
          {
            name: 'short-burst',
            ttl: 5000,
            limit: 5,
          },
          {
            name: 'login-attempts',
            ttl: 60000,
            limit: config.get<number>('THROTTLE_LOGIN_LIMIT', 5),
          },
        ],
      }),
    }),
  ],
  providers: [RedisThrottlerStorage],
  exports: [ThrottlerModule, RedisThrottlerStorage],
})
export class AppThrottlerModule {}
