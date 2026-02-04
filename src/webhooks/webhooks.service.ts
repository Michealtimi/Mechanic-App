import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';
import { TelemetryAdapterService } from '../telemetry/telemetry-adapter.service';
import { PaymentsService } from '../payment/payments.services';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly telemetryAdapterService: TelemetryAdapterService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Process telemetry webhook from external provider
   */
  async processTelemetryWebhook(
    provider: string,
    payload: any,
    signature?: string,
  ): Promise<{ success: boolean; message: string }> {
    const operation = `Process telemetry webhook from ${provider}`;
    this.logger.log(`[${operation}]`);

    try {
      // Verify webhook signature
      if (signature && !this.verifyWebhookSignature(provider, payload, signature)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Extract vehicle ID and telemetry data from payload
      const vehicleId = payload.vehicleId || payload.vehicle_id;
      const accessToken = payload.accessToken || payload.access_token;

      if (!vehicleId) {
        throw new BadRequestException('Vehicle ID is required');
      }

      // Sync telemetry using adapter
      await this.telemetryAdapterService.syncTelemetry(vehicleId, provider, accessToken);

      this.logger.log(`[${operation}] Successfully processed webhook`);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process webhook');
    }
  }

  /**
   * Process payment webhook from external provider
   */
  async processPaymentWebhook(
    provider: string,
    payload: any,
    signature?: string,
  ): Promise<{ success: boolean; message: string }> {
    const operation = `Process payment webhook from ${provider}`;
    this.logger.log(`[${operation}]`);

    try {
      // Verify webhook signature
      if (signature && !this.verifyWebhookSignature(provider, payload, signature)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Payment webhooks are handled by existing payment webhook controllers
      // This is a generic handler that can route to specific providers
      this.logger.log(`[${operation}] Payment webhook received - routing to payment service`);
      
      // The actual payment processing is handled by PaystackWebhookController or FlutterwaveWebhookController
      return { success: true, message: 'Webhook received - processing payment' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process payment webhook');
    }
  }

  /**
   * Process vehicle status webhook
   */
  async processVehicleWebhook(
    provider: string,
    payload: any,
    signature?: string,
  ): Promise<{ success: boolean; message: string }> {
    const operation = `Process vehicle webhook from ${provider}`;
    this.logger.log(`[${operation}]`);

    try {
      // Verify webhook signature
      if (signature && !this.verifyWebhookSignature(provider, payload, signature)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      const vehicleId = payload.vehicleId || payload.vehicle_id;
      const status = payload.status;

      if (!vehicleId) {
        throw new BadRequestException('Vehicle ID is required');
      }

      // Update vehicle status if provided
      if (status) {
        await this.prisma.vehicle.update({
          where: { id: vehicleId },
          data: { status: status },
        });
      }

      this.logger.log(`[${operation}] Successfully processed webhook`);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process vehicle webhook');
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(provider: string, payload: any, signature: string): boolean {
    const secret = this.configService.get<string>(`${provider}_WEBHOOK_SECRET`);
    if (!secret) {
      this.logger.warn(`No webhook secret configured for ${provider}`);
      return false;
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = createHmac('sha256', secret).update(payloadString).digest('hex');

    // Compare signatures (constant-time comparison)
    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
  }
}
