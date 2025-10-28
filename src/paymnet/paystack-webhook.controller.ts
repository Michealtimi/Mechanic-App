
import { Controller, Post, Req, HttpCode, Headers, ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.services';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(200)
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: { rawBody: Buffer, body: any },
  ) {
    if (!signature) {
        throw new ForbiddenException('Paystack signature missing.');
    }
    
    // Calls service with explicit gateway name
    await this.paymentService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }
}