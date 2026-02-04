import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentQueueProcessor } from './processors/payment-queue.processor';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';
import { PrismaModule } from 'prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { PaymentModule } from 'src/payment/payments.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    PaymentModule,
    NotificationModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    // Payment Queue
    BullModule.registerQueue({
      name: 'payment',
    }),
    // Notification Queue
    BullModule.registerQueue({
      name: 'notification',
    }),
    // Telemetry Queue (for Phase 2)
    BullModule.registerQueue({
      name: 'telemetry',
    }),
  ],
  providers: [PaymentQueueProcessor, NotificationQueueProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
