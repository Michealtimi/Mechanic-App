// src/modules/payment/paystack-webhook.controller.ts

import {
  Controller,
  Post,
  Req,
  HttpCode,
  Headers,
  ForbiddenException,
  Logger,
  RawBodyRequest, // Import RawBodyRequest for better typing
} from '@nestjs/common';
import { PaymentsService } from './payments.service'; // ⬅️ CORRECT: PaymentsService (plural)
import { Request } from 'express'; // Import Request from express for rawBody

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {} // ⬅️ CORRECT: paymentsService injection

  @Post()
  @HttpCode(200) // Always respond with 200 OK to webhooks unless there's a critical error on *your* side
  async handlePaystackWebhook( // Method name is fine here
    @Headers('x-paystack-signature') signature: string, // Paystack uses 'x-paystack-signature'
    @Req() req: RawBodyRequest<Request>, // ⬅️ CORRECT: Type for rawBody
  ) {
    this.logger.log('Received Paystack webhook.');

    // 1. Check for signature header
    if (!signature) {
      this.logger.warn('Paystack webhook received without x-paystack-signature header.');
      // Return 403 Forbidden to the gateway if signature is missing or invalid
      throw new ForbiddenException('Paystack signature missing.');
    }

    // 2. Ensure rawBody is available
    if (!req.rawBody) {
      this.logger.error('Raw body not available for Paystack webhook. Check NestJS config.');
      throw new ForbiddenException('Raw body not available for signature verification.');
    }

    try {
      // 3. Delegate to PaymentsService's specific Paystack handler
      // The PaymentsService.handleWebhook is currently set up for Paystack signature verification
      await this.paymentsService.handleWebhook(signature, req.rawBody);
      this.logger.log('Paystack webhook processed successfully.');
      return { received: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      this.logger.error(`Error processing Paystack webhook: ${error.message}`, error.stack);
      // Re-throw the exception so NestJS can handle it and return an appropriate HTTP status
      throw error;
    }
  }
}