// src/modules/payment/webhooks/paystack-webhook.controller.ts
import { Controller, Post, Req, Res, HttpCode, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from './payment.services';


@Controller('webhooks/paystack')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(200)
  async handlePaystackEvent(@Req() req: Request, @Res() res: Response) {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const payload = req.body;

      // (Optional) verify signature header from Paystack here for security
      this.logger.log(`📬 Paystack webhook received: ${payload.event}`);

      if (payload.event === 'charge.success') {
        const reference = payload.data.reference;
        await this.paymentService.verify(reference);
      }

      res.status(200).send('ok');
    } catch (err) {
      this.logger.error('Webhook processing failed', err);
      res.status(500).send('Webhook error');
    }
  }
}
