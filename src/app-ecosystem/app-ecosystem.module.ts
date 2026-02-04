import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookSubscriptionController } from './webhook-subscription.controller';
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [WebhookSubscriptionController],
  providers: [WebhookSubscriptionService],
  exports: [WebhookSubscriptionService],
})
export class AppEcosystemModule {}
