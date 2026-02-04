import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import {
  CreateWebhookSubscriptionDto,
  WebhookSubscriptionResponseDto,
  WebhookEvent,
} from './dto/webhook-subscription.dto';

@Injectable()
export class WebhookSubscriptionService {
  private readonly logger = new Logger(WebhookSubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Create webhook subscription
   */
  async createSubscription(
    dto: CreateWebhookSubscriptionDto,
    userId: string,
    organizationId?: string,
  ): Promise<WebhookSubscriptionResponseDto> {
    const operation = `Create webhook subscription for ${dto.url}`;
    this.logger.log(`[${operation}]`);

    try {
      const subscription = await this.prisma.webhookSubscription.create({
        data: {
          url: dto.url,
          events: dto.events,
          userId,
          organizationId: organizationId || null,
          secret: dto.secret || null,
          isActive: true,
        },
      });

      this.logger.log(`[${operation}] Subscription created: ${subscription.id}`);

      return {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events as WebhookEvent[],
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create webhook subscription');
    }
  }

  /**
   * List webhook subscriptions
   */
  async listSubscriptions(userId: string, organizationId?: string): Promise<WebhookSubscriptionResponseDto[]> {
    const operation = 'List webhook subscriptions';
    this.logger.log(`[${operation}]`);

    try {
      const subscriptions = await this.prisma.webhookSubscription.findMany({
        where: {
          userId,
          organizationId: organizationId || null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return subscriptions.map((sub) => ({
        id: sub.id,
        url: sub.url,
        events: sub.events as WebhookEvent[],
        isActive: sub.isActive,
        createdAt: sub.createdAt,
      }));
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to list webhook subscriptions');
    }
  }

  /**
   * Delete webhook subscription
   */
  async deleteSubscription(subscriptionId: string, userId: string): Promise<void> {
    const operation = `Delete webhook subscription ${subscriptionId}`;
    this.logger.log(`[${operation}]`);

    try {
      const subscription = await this.prisma.webhookSubscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new NotFoundException('Webhook subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('You can only delete your own subscriptions');
      }

      await this.prisma.webhookSubscription.delete({
        where: { id: subscriptionId },
      });

      this.logger.log(`[${operation}] Subscription deleted`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete webhook subscription');
    }
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(event: WebhookEvent, payload: any): Promise<void> {
    const operation = `Trigger webhook for event ${event}`;
    this.logger.log(`[${operation}]`);

    try {
      // Find all active subscriptions for this event
      // Note: Prisma JSON field filtering - events is stored as JSON array
      const subscriptions = await this.prisma.webhookSubscription.findMany({
        where: {
          isActive: true,
        },
      });

      // Filter subscriptions that include this event (since Prisma doesn't support array_contains for JSON)
      const filteredSubscriptions = subscriptions.filter((sub) => {
        const events = sub.events as string[];
        return Array.isArray(events) && events.includes(event);
      });

      // Send webhook to each subscription
      for (const subscription of filteredSubscriptions) {
        try {
          const signature = subscription.secret
            ? this.generateSignature(JSON.stringify(payload), subscription.secret)
            : null;

          await firstValueFrom(
            this.httpService.post(subscription.url, payload, {
              headers: {
                'X-Webhook-Event': event,
                'X-Webhook-Signature': signature || '',
                'X-Webhook-Subscription-Id': subscription.id,
              },
              timeout: 5000, // 5 second timeout
            }),
          );

          this.logger.log(`[${operation}] Webhook sent to ${subscription.url}`);
        } catch (error) {
          this.logger.error(`[${operation}] Failed to send webhook to ${subscription.url}: ${error.message}`);
          // Continue with other subscriptions even if one fails
        }
      }
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      // Don't throw - webhook failures shouldn't break the main flow
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }
}
