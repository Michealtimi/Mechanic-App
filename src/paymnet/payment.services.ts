// src/modules/payment/payment.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; // Assuming path
import { IPaymentGateway } from './interface/payment-gateway.interface';
import { PaystackGateway } from './strategy/paystack.gateway';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('IPaymentGateway') private readonly gateway: IPaymentGateway,
  ) {
        this.logger.log(`Active Payment Gateway: ${this.gateway.constructor.name}`);
    }

  // ===============================
  // 1. INITIATE PAYMENT
  // ===============================
  async initializePayment(bookingId: string, userId: string) {
    const operation = `Initialize payment for booking ${bookingId}`;

    try {
      this.logger.log(`Starting: ${operation}`);

      // 1. Authorization & Fetch Booking
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true, payment: true },
      });
      
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.payment?.status === 'SUCCESS') { // Booking has one-to-one with payment
          throw new BadRequestException('Payment for this booking has already been completed.');
      }
      if (!booking.customer?.email) {
          throw new InternalServerErrorException('Customer email missing for payment initiation.');
      }
      
      const reference = `BK-${Date.now()}-${booking.id}`;
      const amount = booking.price * 100; // Expected kobo/cents

      // 2. Delegate to the active Gateway Strategy
      const gatewayResponse = await this.gateway.initializePayment({
        amount,
        email: booking.customer.email,
        metadata: { bookingId, userId, reference },
      });

      // 3. Persist PENDING Record
      await this.prisma.payment.create({
        data: {
          bookingId,
          reference: gatewayResponse.reference,
          amount: booking.price, // Stored in major currency
          status: 'PENDING',
          method: this.gateway.constructor.name, // Assuming 'method' is the field for gateway name
        },
      });

      this.logger.log(`✅ Payment initialized successfully: ${gatewayResponse.reference}`);
      return { paymentUrl: gatewayResponse.paymentUrl, reference: gatewayResponse.reference };
    } catch (err: any) {
        // Log error stack and re-throw known errors
        this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
        if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof ForbiddenException) {
            throw err;
        }
        throw new InternalServerErrorException('Failed to initialize payment via gateway');
    }
  }

  // ===============================
  // 2. VERIFY PAYMENT
  // ===============================
  async verifyPayment(reference: string) {
    const operation = `Verify payment ${reference}`;

    try {
      this.logger.log(`Starting: ${operation}`);
      
      // 1. Find the existing payment record
      const existing = await this.prisma.payment.findUnique({ where: { reference } });
      if (!existing) throw new NotFoundException('Payment record not found');
      
      // Idempotency Check: Already success? Throw bad request to the frontend client.
      if (existing.status === 'SUCCESS') {
          this.logger.warn(`Verification called for successful payment: ${reference}`);
          throw new BadRequestException('Payment has already been successfully verified.');
      }
      
      // 2. Delegate Verification to the active Gateway
      const verification = await this.gateway.verifyPayment(reference);
      
      // 3. Business Logic Check & DB Update
      const status = verification.status.toUpperCase();
      
      if (status !== 'SUCCESS') {
          // Update status to FAILED/PENDING based on gateway response
          await this.prisma.payment.update({
              where: { reference },
              data: { status: status === 'FAILED' ? 'FAILED' : 'PENDING' },
          });
          this.logger.warn(`Verification failed for ${reference}. Status: ${status}`);
          throw new ForbiddenException(`Payment not successful. Status: ${status}`);
      }
      
      // SUCCESS: Update Database
      await this.prisma.payment.update({
        where: { reference },
        data: { 
            status, 
            // rawResponse: verification.raw, // This field does not exist on the Payment model
            verifiedAt: new Date(),
        },
      });

      this.logger.log(`✅ Payment verified successfully: ${reference}`);
      return verification;
    } catch (err: any) {
        this.logger.error(`❌ Verification failed: ${operation}. ${err.message}`, err.stack);
        if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException) {
            throw err;
        }
        throw new InternalServerErrorException('Verification failed due to an unknown server error');
    }
  }

  // ===============================
  // 3. WEBHOOK HANDLER (Primary source of truth)
  // ===============================
  async handleWebhook(signature: string, rawBody: Buffer) { // Expect raw body for security
    const operation = `Handle webhook event`;

    try {
      this.logger.log(`Processing: ${operation}`);
      
      // 1. Convert raw body to JSON payload
      const payload = JSON.parse(rawBody.toString('utf-8'));
      const reference = payload.data?.reference || payload.reference;
      
      if (!reference) {
          throw new BadRequestException('Webhook payload missing transaction reference.');
      }
      
      // 2. Security Check (Assumes we check Paystack's signature if the active gateway is Paystack)
      // NOTE: In a multi-gateway system, this check would need to determine the source gateway first.
      if (this.gateway instanceof PaystackGateway) {
        if (!this.gateway.verifyWebhookSignature(signature, rawBody)) {
            this.logger.error('❌ Webhook signature verification failed.', { signature });
            throw new ForbiddenException('Invalid webhook signature.');
        }
      } else {
        // Add logic for other gateways like Flutterwave if they have signature verification
      }
      // Add similar check for Flutterwave/other gateways

      // 3. Use the reliable verifyPayment method for final state update (Idempotent)
      // We wrap the call and catch expected failures (like 'Payment not successful')
      try {
          await this.verifyPayment(reference);
      } catch (e: any) {
          // If the payment is not successful (403), we ignore it, as the status is updated inside verifyPayment
          if (e.status !== 403) { 
              throw e;
          }
      }

      this.logger.log(`✅ Webhook successfully processed for ${reference}`);
      return { success: true };
      
    } catch (err: any) {
      this.logger.error(`❌ Webhook failed: ${operation}`, err.stack);
      // Throwing an exception here ensures the controller returns a 500 status to the gateway.
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  // ===============================
  // 4. CAPTURE PAYMENT (Placeholder)
  // ===============================
  async capturePayment(bookingId: string): Promise<void> {
    this.logger.log(`[capturePayment] Placeholder for capturing payment for booking: ${bookingId}`);
    // TODO: Implement logic to capture a pre-authorized payment
  }

  // ===============================
  // 5. PARTIAL REFUND (Placeholder)
  // ===============================
  async partialRefund(bookingId: string, amount: number): Promise<void> {
    this.logger.log(`[partialRefund] Placeholder for refunding ${amount} for booking: ${bookingId}`);
    // TODO: Implement logic for partial refunds via the gateway
  }
}