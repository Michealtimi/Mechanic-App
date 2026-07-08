// src/payment/payments.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payments.controller';
import { PaymentsService } from './payments.services';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { FlutterwaveWebhookController } from './flutterwave-webhook.controller';
import { WalletModule } from 'src/wallet/wallet.module';
import { NotificationModule } from 'src/notification/notification.module';
import { MetricsModule } from 'src/metrics/metrics.module';
import { PaymentEventService } from './payment-event.service';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [ConfigModule, WalletModule, NotificationModule, MetricsModule],
  providers: [
    PrismaService,
    PaymentGatewayFactory,
    PaymentsService,
    PaymentEventService,
    PaymentEventRepository,
    {
      provide: 'IPaymentGateway',
      useFactory: (factory: PaymentGatewayFactory) => factory.getDefault(),
      inject: [PaymentGatewayFactory],
    },
  ],
  controllers: [PaymentController, PaystackWebhookController, FlutterwaveWebhookController],
  exports: [PaymentsService, PaymentGatewayFactory, 'IPaymentGateway'],
})
export class PaymentModule {}
