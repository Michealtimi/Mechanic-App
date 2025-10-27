import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PaymentGateway } from './gateways/payment-gateway.interface';
import { PaystackGateway } from './gateways/paystack.gateway';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private gateway: PaymentGateway;

  constructor(private prisma: PrismaService) {
    // choose gateway from env later
    this.gateway = new PaystackGateway(process.env.PAYSTACK_SECRET_KEY, process.env.PAYSTACK_BASE_URL);
  }

  /**
   * Initiate a payment for a booking.
   * - Creates Payment record (INITIATED)
   * - Calls gateway to get checkout/url & reference
   */
  async initiatePaymentForBooking(bookingId: string, amountKobo: number, metadata: any) {
    try {
      // create internal payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId,
          reference: `tmp-${Date.now()}`,
          gateway: 'PAYSTACK',
          amount: amountKobo,
          status: 'INITIATED',
        },
      });

      // call gateway to create charge
      const { reference, checkoutUrl } = await this.gateway.createCharge(amountKobo, 'NGN', { bookingId, ...metadata });

      // update payment with real reference
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { reference },
      });

      return { payment: updated, checkoutUrl };
    } catch (err) {
      this.logger.error('initiatePaymentForBooking error', err);
      throw new InternalServerErrorException('Failed to initiate payment');
    }
  }

  /**
   * Verify payment (called by webhook or manual check)
   */
  async verifyPayment(reference: string) {
    try {
      const gatewayResult = await this.gateway.verifyPayment(reference);

      const payment = await this.prisma.payment.findUnique({ where: { reference } });
      if (!payment) throw new Error('Payment record not found');

      if (gatewayResult.success) {
        await this.prisma.payment.update({ where: { reference }, data: { status: 'SUCCESS', paidAt: new Date() }});
        // create escrow record
        await this.prisma.escrow.create({
          data: {
            bookingId: payment.bookingId,
            amount: payment.amount,
            status: 'HELD',
          },
        });
      } else {
        await this.prisma.payment.update({ where: { reference }, data: { status: 'FAILED' }});
      }

      return gatewayResult;
    } catch (err) {
      this.logger.error('verifyPayment error', err);
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  async partialRefund(reference:string, amount:number) {
    // call gateway partial refund API if available
    if (!this.gateway.partialRefund) throw new Error('Partial refund not supported by gateway');
    return this.gateway.partialRefund(reference, amount);
  }

  // capturePayment stub if you need card auth capture flows
  async capturePayment(paymentId: string) {
    // provider specific capture: implement if using auth/capture flow
  }
}
