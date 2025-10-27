// src/modules/payment/payment.webhook.controller.ts
import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.services';

@Controller('webhooks/paystack')
export class PaymentWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Req() req, @Res() res) {
    await this.paymentService.handleWebhook(req.body);
    return res.status(200).send({ received: true });
  }
}
