/* eslint-disable prettier/prettier */
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
import { Prisma, BookingStatus, PaymentStatus as PrismaPaymentStatus, PaymentEventType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { WalletService } from 'src/wallet/wallet.service';
import { createHmac } from 'crypto';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PaymentEventService } from './payment-event.service';
import { MetricsService } from 'src/metrics/metrics.service'; 

/**
 * PRODUCTION-READY PAYMENTS SERVICE
 * Handles: Initialization, Verification, Webhooks, and Post-Payment Actions.
 * Features: Metrics, Audit Logs, Idempotency, and Transaction Timeouts.
 */

interface InitializePaymentDto {
  bookingId: string;
  amount: bigint;
  gateway: string;
  metadata: Record<string, any>;
  mechanicSubaccount?: string | null;
  bookingSegmentId?: string; // Optional: for segment-level payments
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('IPaymentGateway') private readonly gateway: IPaymentGateway,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly notificationGateway: NotificationGateway,
    private readonly auditLog: PaymentEventService,
  ) {}

  // ===============================
  // 1. INITIALIZE PAYMENT
  // ===============================
  async initialize(dto: InitializePaymentDto) {
    const start = Date.now();
    this.metrics.increment('payments_initialized_total');

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { customer: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status !== BookingStatus.PENDING) {
          throw new BadRequestException(`Invalid booking status: ${booking.status}`);
      }

      const reference = `BK-${Date.now()}-${dto.bookingId}`;
      
      const gatewayResponse = await this.gateway.initializePayment({
        amount: Number(dto.amount),
        email: booking.customer.email,
        metadata: { ...dto.metadata, reference },
      });

      // Get booking segments if multi-segment booking
      const bookingWithSegments = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { segments: true },
      });

      const result = await this.prisma.$transaction(async (tx) => {
        // If segment-specific payment, create payment for that segment
        if (dto.bookingSegmentId) {
          const segment = bookingWithSegments?.segments.find(s => s.id === dto.bookingSegmentId);
          if (!segment) {
            throw new NotFoundException(`Segment ${dto.bookingSegmentId} not found`);
          }

          const payment = await tx.payment.create({
            data: {
              bookingId: dto.bookingId,
              bookingSegmentId: dto.bookingSegmentId,
              userId: booking.customerId,
              reference: gatewayResponse.reference,
              amount: dto.amount,
              status: 'PENDING',
              gateway: dto.gateway,
              rawGatewayResponse: gatewayResponse.raw,
            },
          });

          // SAFE AUDIT LOG
          try {
            await this.auditLog.recordOrIgnore({
              paymentId: payment.id,
              gateway: dto.gateway,
              gatewayEvent: gatewayResponse.reference,
              type: PaymentEventType.INITIATED,
              rawPayload: gatewayResponse.raw,
            });
          } catch (e) { this.logger.error('Logging failed', e); }

          return { paymentUrl: gatewayResponse.paymentUrl, reference: gatewayResponse.reference, segmentId: dto.bookingSegmentId };
        }

        // For booking-level payment, create main payment record
        // If multi-segment, also create segment-level payment records
        const mainPayment = await tx.payment.create({
          data: {
            bookingId: dto.bookingId,
            userId: booking.customerId,
            reference: gatewayResponse.reference,
            amount: dto.amount,
            status: 'PENDING',
            gateway: dto.gateway,
            rawGatewayResponse: gatewayResponse.raw,
          },
        });

        // Create segment-level payment records if segments exist
        if (bookingWithSegments?.segments && bookingWithSegments.segments.length > 0) {
          const segmentPayments = await Promise.all(
            bookingWithSegments.segments.map(segment =>
              tx.payment.create({
                data: {
                  bookingId: dto.bookingId,
                  bookingSegmentId: segment.id,
                  userId: booking.customerId,
                  reference: `${gatewayResponse.reference}-SEG-${segment.id}`,
                  amount: segment.price,
                  status: 'PENDING',
                  gateway: dto.gateway,
                  metadata: { parentPaymentId: mainPayment.id, segmentType: segment.type },
                },
              })
            )
          );
          this.logger.log(`Created ${segmentPayments.length} segment payment records`);
        }

        // SAFE AUDIT LOG
        try {
          await this.auditLog.recordOrIgnore({
            paymentId: mainPayment.id,
            gateway: dto.gateway,
            gatewayEvent: gatewayResponse.reference,
            type: PaymentEventType.INITIATED,
            rawPayload: gatewayResponse.raw,
          });
        } catch (e) { this.logger.error('Logging failed', e); }

        return { paymentUrl: gatewayResponse.paymentUrl, reference: gatewayResponse.reference };
      }, { maxWait: 5000, timeout: 10000 });

      const duration = Date.now() - start;
      this.metrics.observe('payment_init_duration_seconds', duration / 1000);
      this.logger.log(`initializePayment finished in ${duration}ms`);
      
      return result;
    } catch (err: any) {
      this.metrics.increment('payments_initialized_failed_total');
      this.logger.error(`Initialization Error: ${err.message}`, err.stack);
      throw err;
    }
  }

  // ===============================
  // 2. VERIFY PAYMENT (Truth Provider)
  // ===============================
  async verifyPayment(reference: string, gatewayName: string) {
    const start = Date.now();
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    
    if (!payment) throw new NotFoundException('Payment record missing');

    // 🛡️ THE FINAL GUARD (Idempotency)
    if ([PrismaPaymentStatus.SUCCESS, PrismaPaymentStatus.CAPTURED].includes(payment.status)) {
        return payment;
    }

    const verification = await this.gateway.verifyPayment(reference);
    const status = verification.status.toUpperCase() as PrismaPaymentStatus;

    const result = await this.prisma.$transaction(async (tx) => {
      // 📝 AUDIT LOG
      try {
        await this.auditLog.recordOrIgnore({
          paymentId: payment.id,
          gateway: gatewayName,
          gatewayEvent: `${reference}_v_${Date.now()}`,
          type: PaymentEventType.VERIFIED,
          rawPayload: verification.raw,
        });
      } catch (e) { this.logger.error('Audit failed', e); }

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { 
          status, 
          verifiedAt: new Date(), 
          rawGatewayResponse: verification.raw 
        },
      });

      if (status === PrismaPaymentStatus.SUCCESS || status === PrismaPaymentStatus.CAPTURED) {
        await this.triggerPostPaymentActions(tx, updated.id);
      }
      return updated;
    }, { maxWait: 5000, timeout: 10000 });

    this.logger.log(`verifyPayment for ${reference} took ${Date.now() - start}ms`);
    return result;
  }

  // ===============================
  // 3. WEBHOOK HANDLER (State Machine)
  // ===============================
  async handleWebhook(signature: string, rawBody: Buffer) {
    const secret = this.configService.get('PAYSTACK_WEBHOOK_SECRET');
    const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) throw new ForbiddenException('Invalid Signature');

    const payload = JSON.parse(rawBody.toString());
    const reference = payload.data.reference;

    // Record Webhook immediately for audit
    try {
        await this.auditLog.recordOrIgnore({
            paymentId: reference, 
            gateway: 'PAYSTACK',
            gatewayEvent: payload.data.id.toString(),
            type: PaymentEventType.WEBHOOK,
            rawPayload: payload,
        });
    } catch (e) { this.logger.error('Webhook audit failed', e); }

    // 🚀 EVENT ROUTING
    switch(payload.event) {
      case 'charge.success':
        await this.verifyPayment(reference, 'PAYSTACK');
        break;
      
      case 'charge.failed':
        this.metrics.increment('payments_failed_total');
        await this.prisma.payment.update({
            where: { reference },
            data: { status: 'FAILED' }
        });
        break;

      case 'refund.success':
        this.logger.log(`Refund detected for ${reference}`);
        break;

      default:
        this.logger.debug(`Unhandled event: ${payload.event}`);
    }
  }

  // ===============================
  // 4. POST-PAYMENT (Atomic)
  // ===============================
  private async triggerPostPaymentActions(tx: Prisma.TransactionClient, paymentId: string) {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: {
        booking: { include: { segments: true } },
        bookingSegment: true,
      },
    });

    if (payment.booking) {
      // 1. Update Booking
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PrismaPaymentStatus.SUCCESS,
        },
      });

      // 2. For segment-level payments, don't credit wallet yet (wait for segment completion)
      // For booking-level payments, credit wallet if mechanic assigned
      if (!payment.bookingSegmentId && payment.booking.mechanicId) {
        await this.walletService.creditMechanicInTransaction(tx, payment.booking.mechanicId, payment.amount, payment.bookingId);
      }

      // 3. Notify
      await this.notificationGateway.emitBookingConfirmed(payment.booking.customerId, payment.booking.id);
    }
  }

  // ===============================
  // 5. RELEASE SEGMENT PAYMENT
  // ===============================
  /**
   * Release payment for a completed segment
   * Moves funds from escrow to mechanic wallet
   */
  async releaseSegmentPayment(segmentId: string) {
    const operation = 'releaseSegmentPayment';
    this.logger.log(`[${operation}] Releasing payment for segment ${segmentId}`);

    try {
      const segment = await this.prisma.bookingSegment.findUnique({
        where: { id: segmentId },
        include: { booking: true, payments: true },
      });

      if (!segment) {
        throw new NotFoundException(`Segment ${segmentId} not found`);
      }

      if (segment.status !== 'COMPLETED') {
        throw new BadRequestException(`Segment ${segmentId} is not completed`);
      }

      if (!segment.booking.mechanicId) {
        throw new BadRequestException('No mechanic assigned to booking');
      }

      // Find segment payment
      const segmentPayment = segment.payments.find(p => p.bookingSegmentId === segmentId);
      if (!segmentPayment) {
        throw new NotFoundException(`Payment not found for segment ${segmentId}`);
      }

      if (segmentPayment.status !== PrismaPaymentStatus.SUCCESS && segmentPayment.status !== PrismaPaymentStatus.CAPTURED) {
        throw new BadRequestException(`Payment for segment ${segmentId} is not in SUCCESS/CAPTURED status`);
      }

      // Release payment in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Credit mechanic wallet
        await this.walletService.creditMechanicInTransaction(
          tx,
          segment.booking.mechanicId!,
          segmentPayment.amount,
          segment.bookingId,
          { segmentId, paymentId: segmentPayment.id, type: 'SEGMENT_PAYMENT' },
        );

        // Update payment metadata
        await tx.payment.update({
          where: { id: segmentPayment.id },
          data: {
            metadata: {
              ...(segmentPayment.metadata as any || {}),
              releasedAt: new Date().toISOString(),
              released: true,
            },
          },
        });

        return { segmentId, amount: segmentPayment.amount.toString(), mechanicId: segment.booking.mechanicId };
      }, { maxWait: 5000, timeout: 10000 });

      this.logger.log(`[${operation}] Released ${result.amount} to mechanic ${result.mechanicId} for segment ${segmentId}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ===============================
  // 5b. REFUND (e.g. on booking cancel)
  // ===============================
  /**
   * Refund a payment by reference. Amount in kobo (smallest unit); omit for full refund.
   * Optionally run inside a Prisma transaction (tx).
   */
  async refund(
    reference: string,
    amountKobo?: number | bigint | { toNumber?: () => number; toString: () => string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) throw new NotFoundException(`Payment not found: ${reference}`);
    if (payment.status === PrismaPaymentStatus.REFUNDED) {
      this.logger.log(`Payment ${reference} already refunded`);
      return;
    }
    const amount =
      amountKobo != null
        ? typeof amountKobo === 'object' && 'toNumber' in amountKobo
          ? Math.round((amountKobo as any).toNumber())
          : Math.round(Number(amountKobo))
        : undefined;
    const result = await this.gateway.refund(reference, amount);
    if (!result.success) {
      throw new BadRequestException(result.message ?? 'Refund failed');
    }
    const refundAmount = amount ?? Number(payment.amount);
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PrismaPaymentStatus.REFUNDED,
        refundedAmount: refundAmount,
        metadata: { ...(payment.metadata as any || {}), refundedAt: new Date().toISOString() },
      },
    });
    this.logger.log(`Refunded ${reference} (${refundAmount} kobo)`);
  }

  // ===============================
  // 6. CALCULATE PAYMENT STATUS
  // ===============================
  /**
   * Calculate overall payment status based on segment payments
   */
  async calculatePaymentStatus(bookingId: string): Promise<{
    status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
    totalAmount: string;
    paidAmount: string;
    segments: Array<{ segmentId: string; status: string; amount: string }>;
  }> {
    const operation = 'calculatePaymentStatus';
    this.logger.log(`[${operation}] Calculating payment status for booking ${bookingId}`);

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          segments: {
            include: { payments: true },
          },
          payments: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      // Calculate segment-level payments
      const segmentStatuses = booking.segments.map(segment => {
        const segmentPayment = segment.payments.find(p => p.bookingSegmentId === segment.id);
        const isPaid = segmentPayment && 
          (segmentPayment.status === PrismaPaymentStatus.SUCCESS || 
           segmentPayment.status === PrismaPaymentStatus.CAPTURED);

        return {
          segmentId: segment.id,
          status: isPaid ? 'PAID' : 'PENDING',
          amount: segment.price.toString(),
        };
      });

      const totalAmount = booking.totalPrice || booking.price;
      const paidSegments = segmentStatuses.filter(s => s.status === 'PAID');
      const paidAmount = paidSegments.reduce((sum, seg) => {
        return sum.plus(new (require('decimal.js').Decimal)(seg.amount));
      }, new (require('decimal.js').Decimal)(0));

      let status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
      if (paidSegments.length === 0) {
        status = 'PENDING';
      } else if (paidSegments.length === segmentStatuses.length) {
        status = 'COMPLETED';
      } else {
        status = 'PARTIAL';
      }

      return {
        status,
        totalAmount: totalAmount.toString(),
        paidAmount: paidAmount.toString(),
        segments: segmentStatuses,
      };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}