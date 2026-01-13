// src/modules/payment/flutterwave-webhook.controller.ts

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

@Controller('webhooks/flutterwave')
export class FlutterwaveWebhookController {
  private readonly logger = new Logger(FlutterwaveWebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {} // ⬅️ CORRECT: paymentsService injection

  @Post()
  @HttpCode(200) // Always respond with 200 OK to webhooks unless there's a critical error on *your* side
  async handleFlutterwaveWebhook( // ⬅️ CORRECT: Method name for Flutterwave
    @Headers('verif-hash') signature: string, // Flutterwave uses 'verif-hash'
    @Req() req: RawBodyRequest<Request>, // ⬅️ CORRECT: Type for rawBody
  ) {
    this.logger.log('Received Flutterwave webhook.');

    // 1. Check for signature header
    if (!signature) {
      this.logger.warn('Flutterwave webhook received without verif-hash signature.');
      // Return 403 Forbidden to the gateway if signature is missing or invalid
      throw new ForbiddenException('Flutterwave signature missing.');
    }

    // 2. Ensure rawBody is available
    if (!req.rawBody) {
      this.logger.error('Raw body not available for Flutterwave webhook. Check NestJS config.');
      throw new ForbiddenException('Raw body not available for signature verification.');
    }

    try {
      // 3. Delegate to PaymentsService's specific Flutterwave handler
      await this.paymentsService.handleFlutterwaveWebhook(signature, req.rawBody);
      this.logger.log('Flutterwave webhook processed successfully.');
      return { received: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      this.logger.error(`Error processing Flutterwave webhook: ${error.message}`, error.stack);
      // Re-throw the exception so NestJS can handle it and return an appropriate HTTP status
      // (e.g., ForbiddenException -> 403, BadRequestException -> 400, InternalServerErrorException -> 500)
      throw error;
    }
  }
}