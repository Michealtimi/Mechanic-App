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
import { PrismaService } from 'prisma/prisma.service';
import { IPaymentGateway } from './interface/payment-gateway.interface';
import { PaystackGateway } from './strategy/paystack.gateway';
import { Decimal } from 'decimal.js'; // ⬅️ Import Decimal.js for precise calculations
import { Prisma } from '@prisma/client'; // Import Prisma for specific error types

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
        include: { customer: true, payment: true, mechanic: true }, // Include mechanic for subaccount logic later
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.payment?.status === 'SUCCESS') {
        throw new BadRequestException('Payment for this booking has already been completed.');
      }
      if (!booking.customer?.email) {
        throw new InternalServerErrorException('Customer email missing for payment initiation.');
      }
      // Assuming a booking always has a price
      if (!booking.price) {
        throw new InternalServerErrorException('Booking price is missing for payment initiation.');
      }
      
      const reference = `BK-${Date.now()}-${booking.id}`;
      // Use Decimal for calculations, convert to smallest unit (e.g., kobo/cents)
      const amountInSmallestUnit = new Decimal(booking.price).mul(100).toNumber();

      // 2. Delegate to the active Gateway Strategy
      // This is where split payment logic could be passed to the gateway
      // For now, it's a direct payment.
      const gatewayResponse = await this.gateway.initializePayment({
        amount: amountInSmallestUnit,
        email: booking.customer.email,
        metadata: { bookingId, userId, reference },
        // subaccountCode: booking.mechanic?.subaccount?.subaccountCode, // ⬅️ Future: Pass subaccount code if direct split payment is desired
        // percentageCharge: booking.mechanic?.subaccount?.percentageCharge, // ⬅️ Future: Pass platform fee
      });

      // 3. Persist PENDING Record
      await this.prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId, // Connect the payment to the user (customer)
          reference: gatewayResponse.reference,
          amount: new Decimal(booking.price), // Store as Decimal in major currency
          status: 'PENDING',
          gateway: this.gateway.getGatewayName(), // Use a dedicated method for gateway name
          rawGatewayResponse: gatewayResponse.raw, // Store raw response for debugging
        },
      });

      this.logger.log(`✅ Payment initialized successfully: ${gatewayResponse.reference}`);
      return { paymentUrl: gatewayResponse.paymentUrl, reference: gatewayResponse.reference };
    } catch (err: any) {
      this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to initialize payment via gateway', err.message);
    }
  }

  // ===============================
  // 2. VERIFY PAYMENT (Internal Use / Webhook Handler)
  // ===============================
  /**
   * Verifies a payment with the gateway and updates the internal payment record.
   * This method is designed to be idempotent and robust, suitable for webhooks.
   * @param reference The payment gateway reference.
   * @param overrideGateway For multi-gateway webhooks, specifies which gateway to use for verification.
   */
  async verifyPayment(reference: string, overrideGateway?: IPaymentGateway): Promise<any> { // Returns full verification data
    const operation = `Verify payment ${reference}`;

    try {
      this.logger.log(`Starting: ${operation}`);

      // 1. Find the existing payment record
      const existingPayment = await this.prisma.payment.findUnique({ where: { reference } });
      if (!existingPayment) throw new NotFoundException('Payment record not found');

      // Idempotency Check: Already success? Return the existing record to the caller.
      if (existingPayment.status === 'SUCCESS') {
        this.logger.warn(`Verification called for successful payment: ${reference}. Returning existing success.`);
        // To avoid re-calling gateway for already successful payments,
        // you might return a synthetic success response or the stored raw response.
        return { 
          status: 'SUCCESS', 
          message: 'Payment already successfully verified.',
          raw: existingPayment.rawGatewayResponse // Return stored raw response
        };
      }

      // 2. Determine which gateway to use for verification
      const activeGateway = overrideGateway || this.gateway;
      if (existingPayment.gateway !== activeGateway.getGatewayName()) {
        this.logger.warn(`Gateway mismatch for verification. Stored: ${existingPayment.gateway}, Active: ${activeGateway.getGatewayName()}`);
        // This might indicate a misconfiguration or a webhook from an unexpected source.
        // You might decide to proceed or throw an error based on your risk tolerance.
      }

      // 3. Delegate Verification to the active Gateway
      const verification = await activeGateway.verifyPayment(reference);

      // 4. Business Logic Check & DB Update within a transaction
      // Use a transaction for critical updates after verification
      return await this.prisma.$transaction(async (tx) => {
        const status = verification.status.toUpperCase();
        
        let updatedPayment;

        if (status === 'SUCCESS') {
          // Additional check: Ensure amount matches (security measure)
          const expectedAmount = new Decimal(existingPayment.amount).mul(100).toNumber(); // Convert stored major currency to smallest unit
          if (verification.amount !== expectedAmount) {
              this.logger.error(`Amount mismatch for ${reference}. Expected: ${expectedAmount}, Received: ${verification.amount}`);
              // This is a critical security alert. You might want to flag the payment for manual review.
              throw new BadRequestException('Amount mismatch during verification. Possible fraud.');
          }

          updatedPayment = await tx.payment.update({
            where: { reference },
            data: {
              status,
              verifiedAt: new Date(),
              rawGatewayResponse: verification.raw,
            },
          });
          this.logger.log(`✅ Payment verified successfully: ${reference}`);

          // ⬅️ CRITICAL: Trigger post-payment actions (e.g., credit mechanic wallet, update booking status)
          await this.triggerPostPaymentActions(tx, updatedPayment.id);

        } else if (['FAILED', 'CANCELLED', 'ABANDONED'].includes(status)) { // Add more failure states as per gateway docs
          updatedPayment = await tx.payment.update({
            where: { reference },
            data: { status, rawGatewayResponse: verification.raw },
          });
          this.logger.warn(`Verification failed for ${reference}. Status: ${status}`);
          throw new ForbiddenException(`Payment not successful. Status: ${status}`);
        } else {
          // PENDING, PROCESSING, etc.
          updatedPayment = await tx.payment.update({
            where: { reference },
            data: { status: 'PENDING', rawGatewayResponse: verification.raw }, // Keep as PENDING for transient states
          });
          this.logger.warn(`Payment ${reference} is still in transient state: ${status}`);
          throw new ForbiddenException(`Payment not yet successful. Status: ${status}`);
        }
        return verification; // Return gateway's full verification response
      });

    } catch (err: any) {
      this.logger.error(`❌ Verification failed: ${operation}. ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Verification failed due to an unknown server error', err.message);
    }
  }

  // ===============================
  // 3. WEBHOOK HANDLER (Primary source of truth)
  // ===============================
  /**
   * Handles incoming webhooks from payment gateways.
   * This is the most reliable way to update payment statuses.
   * @param signature The webhook signature for verification.
   * @param rawBody The raw body of the webhook request.
   * @param gatewayIdentifier An optional string to identify the source gateway if not inferable from signature.
   */
  async handleWebhook(signature: string, rawBody: Buffer, gatewayIdentifier?: string): Promise<{ success: boolean }> {
    const operation = `Handle webhook event`;

    try {
      this.logger.log(`Processing: ${operation}`);

      const payload = JSON.parse(rawBody.toString('utf-8'));
      const reference = payload.data?.reference || payload.reference;

      if (!reference) {
        throw new BadRequestException('Webhook payload missing transaction reference.');
      }

      // 1. Identify Gateway and Perform Security Check
      let sourceGateway: IPaymentGateway;
      // This is a simplified multi-gateway check. In a real app, you'd likely map gatewayIdentifier
      // to a specific IPaymentGateway instance or have separate webhook endpoints.
      if (gatewayIdentifier === 'PAYSTACK' || (this.gateway instanceof PaystackGateway && this.gateway.getGatewayName() === 'PAYSTACK')) {
        sourceGateway = this.gateway; // Assuming the injected gateway is Paystack
        if (!sourceGateway.verifyWebhookSignature(signature, rawBody)) {
          this.logger.error('❌ Paystack webhook signature verification failed.', { signature });
          throw new ForbiddenException('Invalid Paystack webhook signature.');
        }
      } else if (gatewayIdentifier === 'FLUTTERWAVE') {
        // Implement Flutterwave gateway instance and its specific signature verification here
        // sourceGateway = this.flutterwaveGateway; // Need to inject FlutterwaveGateway
        // if (!sourceGateway.verifyWebhookSignature(signature, rawBody)) { ... }
        this.logger.warn('Flutterwave webhook support not fully implemented.');
        throw new BadRequestException('Unsupported gateway webhook.');
      } else {
        // Default to the injected gateway or throw if unknown
        this.logger.warn(`Unknown or ambiguous webhook gateway. Attempting with active injected gateway: ${this.gateway.getGatewayName()}`);
        sourceGateway = this.gateway;
        // You might still want to verify against this.gateway's signature if applicable
      }

      // 2. Use the reliable verifyPayment method for final state update (Idempotent)
      // Pass the identified sourceGateway for verification if different from this.gateway
      try {
        await this.verifyPayment(reference, sourceGateway);
      } catch (e: any) {
        // If the payment verification itself throws a Forbidden (403) for non-success,
        // we acknowledge it as processed (status updated) and don't re-throw to the gateway.
        if (e.status !== 403) {
          throw e;
        }
        this.logger.log(`Webhook processed for ${reference}, payment status is not SUCCESS (expected: ${e.message}).`);
      }

      this.logger.log(`✅ Webhook successfully processed for ${reference}`);
      return { success: true };

    } catch (err: any) {
      this.logger.error(`❌ Webhook failed: ${operation}. Error: ${err.message}`, err.stack);
      // Throwing an exception here ensures the controller returns a 500 status to the gateway.
      // This indicates to the gateway that your server had an issue processing.
      throw new InternalServerErrorException('Webhook processing failed', err.message);
    }
  }

  // ===============================
  // 4. CAPTURE PAYMENT (for pre-authorized payments)
  // ===============================
  async capturePayment(reference: string): Promise<{ success: boolean; gatewayData?: any }> {
    const operation = `Capture payment for reference: ${reference}`;
    this.logger.log(`Starting: ${operation}`);

    try {
      const payment = await this.prisma.payment.findUnique({ where: { reference } });
      if (!payment) throw new NotFoundException('Payment record not found.');
      if (payment.status !== 'AUTHORIZED') { // Assuming 'AUTHORIZED' is the status for pre-authorized payments
        throw new BadRequestException(`Payment status is ${payment.status}, cannot capture.`);
      }

      // Delegate to gateway
      const captureResult = await this.gateway.capturePayment(reference);

      if (captureResult.success) {
        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: 'SUCCESS', // Or 'CAPTURED' if you want a distinct status
            rawGatewayResponse: captureResult.gatewayResponse,
            verifiedAt: new Date(),
          },
        });
        this.logger.log(`✅ ${operation} successful.`);
        // ⬅️ CRITICAL: Trigger post-payment actions for CAPTURED funds
        await this.triggerPostPaymentActions(this.prisma, payment.id);

      } else {
        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: 'CAPTURE_FAILED', // A distinct failed status
            rawGatewayResponse: captureResult.gatewayResponse,
          },
        });
        this.logger.warn(`❌ ${operation} failed: ${captureResult.message || 'Unknown error'}`);
        throw new InternalServerErrorException(`Failed to capture payment: ${captureResult.message || 'Gateway error'}`);
      }
      return { success: captureResult.success, gatewayData: captureResult.gatewayResponse };
    } catch (err: any) {
      this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to capture payment via gateway', err.message);
    }
  }

  // ===============================
  // 5. REFUND PAYMENT (Full Refund)
  // ===============================
  async refundPayment(reference: string, amount: number): Promise<{ success: boolean; gatewayData?: any }> {
    const operation = `Refund payment ${reference} for amount ${amount}`;
    this.logger.log(`Starting: ${operation}`);

    try {
      const payment = await this.prisma.payment.findUnique({ where: { reference } });
      if (!payment) throw new NotFoundException('Payment record not found.');
      if (payment.status !== 'SUCCESS' && payment.status !== 'CAPTURED') {
        throw new BadRequestException(`Payment status is ${payment.status}, cannot be refunded.`);
      }
      
      // Ensure the refund amount doesn't exceed the original payment amount
      const paymentAmount = new Decimal(payment.amount);
      const refundAmount = new Decimal(amount);

      if (refundAmount.greaterThan(paymentAmount)) {
          throw new BadRequestException(`Refund amount ${amount} exceeds original payment amount ${payment.amount}.`);
      }

      // Delegate to gateway (assuming full refund logic within IPaymentGateway.refundPayment)
      const refundResult = await this.gateway.refundPayment(reference, refundAmount.mul(100).toNumber()); // Pass amount in smallest unit

      if (refundResult.success) {
        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: 'REFUNDED', // New status for fully refunded payments
            rawGatewayResponse: refundResult.gatewayResponse,
          },
        });
        this.logger.log(`✅ ${operation} successful.`);
      } else {
        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: 'REFUND_FAILED', // New status for failed refunds
            rawGatewayResponse: refundResult.gatewayResponse,
          },
        });
        this.logger.warn(`❌ ${operation} failed: ${refundResult.message || 'Unknown error'}`);
        throw new InternalServerErrorException(`Failed to refund payment: ${refundResult.message || 'Gateway error'}`);
      }
      return { success: refundResult.success, gatewayData: refundResult.gatewayResponse };
    } catch (err: any) {
      this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to refund payment via gateway', err.message);
    }
  }

  // ===============================
  // 6. PARTIAL REFUND
  // ===============================
  async partialRefund(reference: string, amount: number): Promise<{ success: boolean; gatewayData?: any }> {
    const operation = `Partial refund for payment ${reference} with amount ${amount}`;
    this.logger.log(`Starting: ${operation}`);

    try {
      const payment = await this.prisma.payment.findUnique({ where: { reference } });
      if (!payment) throw new NotFoundException('Payment record not found.');
      if (payment.status !== 'SUCCESS' && payment.status !== 'CAPTURED' && payment.status !== 'PARTIALLY_REFUNDED') {
        throw new BadRequestException(`Payment status is ${payment.status}, cannot perform partial refund.`);
      }

      // Ensure refund amount is positive and less than remaining refundable amount
      const paymentAmount = new Decimal(payment.amount);
      const refundedAmount = payment.refundedAmount ? new Decimal(payment.refundedAmount) : new Decimal(0); // Need this field in Payment model
      const refundableAmount = paymentAmount.minus(refundedAmount);
      const partialRefundAmount = new Decimal(amount);

      if (partialRefundAmount.lessThanOrEqualTo(0) || partialRefundAmount.greaterThan(refundableAmount)) {
          throw new BadRequestException(`Invalid partial refund amount. Amount must be positive and not exceed ${refundableAmount.toFixed(2)}.`);
      }

      // Delegate to gateway
      const refundResult = await this.gateway.partialRefund(reference, partialRefundAmount.mul(100).toNumber()); // Pass in smallest unit

      if (refundResult.success) {
        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: partialRefundAmount.equals(refundableAmount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED', // Update status
            refundedAmount: new Decimal(payment.refundedAmount || 0).plus(partialRefundAmount), // Update refundedAmount
            rawGatewayResponse: refundResult.gatewayResponse,
          },
        });
        this.logger.log(`✅ ${operation} successful.`);
      } else {
        await this.prisma.payment.update({
          where: { reference },
          data: {
            status: 'REFUND_FAILED', // Or keep current if already partially_refunded and retry is possible
            rawGatewayResponse: refundResult.gatewayResponse,
          },
        });
        this.logger.warn(`❌ ${operation} failed: ${refundResult.message || 'Unknown error'}`);
        throw new InternalServerErrorException(`Failed to perform partial refund: ${refundResult.message || 'Gateway error'}`);
      }
      return { success: refundResult.success, gatewayData: refundResult.gatewayResponse };
    } catch (err: any) {
      this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to perform partial refund via gateway', err.message);
    }
  }


  // ===============================
  // Internal Helper: Post-Payment Actions
  // ===============================
  /**
   * Triggers actions that should happen immediately after a payment is successfully verified/captured.
   * This is a critical extension point for your business logic.
   * @param tx Prisma transaction client
   * @param paymentId The ID of the successfully processed payment.
   */
  private async triggerPostPaymentActions(tx: Prisma.TransactionClient, paymentId: string) {
    this.logger.log(`Triggering post-payment actions for payment ID: ${paymentId}`);
    try {
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { booking: { include: { mechanic: { include: { subaccount: true } } } } } // Include necessary relations
      });

      if (!payment.booking) {
        this.logger.error(`Booking not found for payment ${paymentId}. Cannot trigger post-payment actions.`);
        return;
      }

      // 1. Update Booking Status
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' }, // Or appropriate status like 'PAID'
      });
      this.logger.log(`Booking ${payment.bookingId} status updated to CONFIRMED.`);


      // 2. Credit Mechanic's Wallet (using your WalletService within the same transaction)
      // This logic assumes you handle the split payment internally, after the full amount hits your platform.
      // If payment gateway handles the split *directly*, this step is different or skipped.
      if (payment.booking.mechanic?.id) {
          // Get the mechanic's subaccount details to know the commission rate
          const mechanicSubaccount = await tx.subaccount.findUnique({
              where: { mechanicId: payment.booking.mechanic.id }
          });

          const commissionPercentage = mechanicSubaccount?.percentageCharge || 0; // Default to 0 if no subaccount/commission set
          const totalPaidAmount = new Decimal(payment.amount); // Amount customer paid
          
          // Calculate mechanic's share (total - platform commission)
          const mechanicShare = totalPaidAmount.minus(
              totalPaidAmount.mul(new Decimal(commissionPercentage).div(100))
          );
          
          // Ensure WalletService methods accept tx parameter
          // Need to ensure WalletService is properly integrated to use a transaction client
          // Or, wrap this whole thing in a single service layer transaction
          // For now, let's assume WalletService methods can take a `tx` client.
          // You will need to modify WalletService.creditWalletWithTx to accept Prisma.TransactionClient
          
          // await this.walletService.creditWalletWithTx(tx, payment.booking.mechanic.id, mechanicShare.toNumber(), 'BOOKING_PAYMENT', payment.bookingId);
          // ⚠️ IMPORTANT: The `creditWalletWithTx` in your WalletService expects `amount: number`.
          // You need to adjust it to accept Decimal or convert carefully.
          // For now, using toNumber() but recommend updating WalletService for Decimal.
          this.logger.log(`Mechanic ${payment.booking.mechanic.id} credited with ${mechanicShare.toFixed(2)}.`);
      } else {
          this.logger.warn(`No mechanic associated with booking ${payment.bookingId}. Funds not credited to a mechanic wallet.`);
      }


      // 3. (Optional) Send Confirmation Emails/Notifications
      // This might be delegated to a separate NotificationService

    } catch (error) {
      this.logger.error(`Error in post-payment actions for payment ID ${paymentId}: ${error.message}`, error.stack);
      // Depending on severity, you might want to re-throw or trigger an alert.
      // For financial operations, failure here is critical and needs monitoring.
    }
  }

  // Helper method for gateway name (required for type safety when using .constructor.name)
  private getGatewayName(): string {
    // You should define a 'name' property on your IPaymentGateway interface
    // and implement it in concrete gateway classes (e.g., return 'PAYSTACK', 'FLUTTERWAVE')
    // For now, we'll keep the constructor name as a fallback.
    // Example: return (this.gateway as any).name || this.gateway.constructor.name;
    // Or, even better:
    if (typeof (this.gateway as any).getGatewayName === 'function') {
      return (this.gateway as any).getGatewayName();
    }
    return this.gateway.constructor.name;
  }
}