// src/modules/payment/payment.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  Req,
  UsePipes,
  ValidationPipe,
  HttpCode,
  BadRequestException,
  ForbiddenException,
  RawBodyRequest,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.services';
import { Public } from 'src/common/decorators/public.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtUserPayload } from 'src/config/jwt.config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PaymentController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post('initiate')
  async initiatePayment(
    @Req() req: { user: JwtUserPayload },
    @Body() body: InitiatePaymentDto,
  ) {
    await this.paymentService.assertCanInitiatePayment(
      req.user.id,
      req.user.role,
      body.bookingId,
    );

    const result = await this.paymentService.initialize({
      bookingId: body.bookingId,
      amount: BigInt(body.amount),
      gateway: body.gateway,
      countryCode: body.countryCode,
      currency: body.currency,
      metadata: (body.metadata as Record<string, any>) || {},
      bookingSegmentId: body.bookingSegmentId,
      mechanicSubaccount: body.mechanicSubaccount,
    });
    return {
      message: 'Payment initialized. Redirect user to the authorizationUrl.',
      ...result,
    };
  }

  @Get('verify')
  async verifyPayment(
    @Req() req: { user: JwtUserPayload },
    @Query('reference') reference: string,
    @Query('gateway') gateway?: string,
  ) {
    if (!reference) {
      throw new BadRequestException('Transaction reference is required for verification.');
    }
    await this.paymentService.assertCanVerifyPayment(req.user.id, req.user.role, reference);
    const gw = (gateway || 'PAYSTACK').toUpperCase();
    const verificationResult = await this.paymentService.verifyPayment(reference, gw);

    return {
      message: 'Payment status retrieved.',
      status: verificationResult.status,
      amount: verificationResult.amount?.toString?.() ?? verificationResult.amount,
    };
  }

  /**
   * Legacy combined webhook: prefers Paystack signature if both headers present.
   * Prefer /webhooks/paystack and /webhooks/flutterwave in production.
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-paystack-signature') paystackSignature: string,
    @Headers('verif-hash') flutterwaveSignature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new ForbiddenException('Raw body not available for signature verification.');
    }
    if (paystackSignature) {
      await this.paymentService.handlePaystackWebhook(paystackSignature, rawBody);
      return { received: true };
    }
    if (flutterwaveSignature) {
      await this.paymentService.handleFlutterwaveWebhook(flutterwaveSignature, rawBody);
      return { received: true };
    }
    throw new ForbiddenException('Missing webhook signature header.');
  }
}
