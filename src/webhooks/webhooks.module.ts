import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from 'prisma/prisma.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { PaymentModule } from '../payment/payments.module';

@Module({
  imports: [PrismaModule, TelemetryModule, PaymentModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
