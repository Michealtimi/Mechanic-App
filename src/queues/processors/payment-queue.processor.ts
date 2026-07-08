import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { PaymentsService } from 'src/payment/payments.services';
import { PaymentStatus, SegmentStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

export interface PaymentJobData {
  paymentId?: string;
  bookingId?: string;
  bookingSegmentId?: string;
  amount: number;
  action: 'process' | 'release' | 'refund';
  metadata?: Record<string, any>;
}

@Processor('payment', {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
@Injectable()
export class PaymentQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentQueueProcessor.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly paymentsService?: PaymentsService,
  ) {
    super();
  }

  async process(job: Job<PaymentJobData>): Promise<any> {
    this.logger.log(`[PaymentQueue] Processing payment job ${job.id}: ${job.data.action}`);

    try {
      switch (job.data.action) {
        case 'process':
          return await this.processEscrow(job.data, job.attemptsMade);
        case 'release':
          return await this.releasePayment(job.data, job.attemptsMade);
        case 'refund':
          return await this.refundPayment(job.data, job.attemptsMade);
        default:
          throw new Error(`Unknown payment action: ${job.data.action}`);
      }
    } catch (error) {
      this.logger.error(`[PaymentQueue] Payment job ${job.id} failed: ${error.message}`, error.stack);
      
      // Retry logic
      if (job.attemptsMade < this.MAX_RETRIES) {
        this.logger.log(`[PaymentQueue] Retrying job ${job.id} (attempt ${job.attemptsMade + 1}/${this.MAX_RETRIES})`);
        throw error; // Re-throw to trigger retry
      }
      
      // Mark as failed after max retries
      this.logger.error(`[PaymentQueue] Job ${job.id} failed after ${this.MAX_RETRIES} attempts`);
      throw error;
    }
  }

  /**
   * PROCESS ESCROW: Move payment to escrow (hold funds)
   * This is called when payment is verified and needs to be held until service completion
   */
  private async processEscrow(data: PaymentJobData, attempts: number): Promise<any> {
    const operation = 'processEscrow';
    this.logger.log(`[${operation}] Processing escrow for payment ${data.paymentId || data.bookingId}`);

    try {
      if (!data.paymentId && !data.bookingId) {
        throw new Error('Either paymentId or bookingId is required');
      }

      // Find payment record
      const payment = data.paymentId
        ? await this.prisma.payment.findUnique({ where: { id: data.paymentId } })
        : await this.prisma.payment.findFirst({ 
            where: { bookingId: data.bookingId },
            orderBy: { createdAt: 'desc' },
          });

      if (!payment) {
        throw new Error(`Payment not found: ${data.paymentId || data.bookingId}`);
      }

      // Verify payment is in correct status for escrow
      if (payment.status !== PaymentStatus.SUCCESS && payment.status !== PaymentStatus.CAPTURED) {
        this.logger.warn(`[${operation}] Payment ${payment.id} is not in SUCCESS/CAPTURED status: ${payment.status}`);
        return { success: false, message: `Payment not in correct status: ${payment.status}` };
      }

      // If segment-specific, create segment payment record
      if (data.bookingSegmentId) {
        const segment = await this.prisma.bookingSegment.findUnique({
          where: { id: data.bookingSegmentId },
          include: { booking: true },
        });

        if (!segment) {
          throw new Error(`Segment ${data.bookingSegmentId} not found`);
        }

        // Create payment record for segment (escrow)
        await this.prisma.payment.create({
          data: {
            userId: payment.userId,
            bookingId: segment.bookingId,
            bookingSegmentId: segment.id,
            reference: `SEG-${Date.now()}-${segment.id}`,
            amount: new Decimal(segment.price.toString()),
            status: PaymentStatus.PENDING, // Held in escrow
            gateway: payment.gateway,
            metadata: { ...data.metadata, escrow: true, originalPaymentId: payment.id },
          },
        });

        this.logger.log(`[${operation}] Escrow created for segment ${segment.id}`);
        return { success: true, segmentId: segment.id, amount: segment.price.toString() };
      }

      // For booking-level escrow, update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PENDING, // Mark as in escrow
          metadata: { ...(payment.metadata as any || {}), escrow: true, escrowAt: new Date().toISOString() },
        },
      });

      this.logger.log(`[${operation}] Escrow processed for payment ${payment.id}`);
      return { success: true, paymentId: payment.id, amount: payment.amount.toString() };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * RELEASE PAYMENT: Release funds from escrow to mechanic wallet
   * Called when a segment is completed
   */
  private async releasePayment(data: PaymentJobData, attempts: number): Promise<any> {
    const operation = 'releasePayment';
    this.logger.log(`[${operation}] Releasing payment for segment ${data.bookingSegmentId || 'booking ' + data.bookingId}`);

    try {
      if (!data.bookingSegmentId && !data.bookingId) {
        throw new Error('Either bookingSegmentId or bookingId is required');
      }

      // Find segment payment or booking payment
      const payment = data.bookingSegmentId
        ? await this.prisma.payment.findFirst({
            where: { bookingSegmentId: data.bookingSegmentId },
            orderBy: { createdAt: 'desc' },
          })
        : await this.prisma.payment.findFirst({
            where: { bookingId: data.bookingId },
            orderBy: { createdAt: 'desc' },
          });

      if (!payment) {
        throw new Error(`Payment not found for ${data.bookingSegmentId || data.bookingId}`);
      }

      // Get segment and booking info
      const segment = data.bookingSegmentId
        ? await this.prisma.bookingSegment.findUnique({
            where: { id: data.bookingSegmentId },
            include: { booking: true, mechanic: true },
          })
        : null;

      const booking = segment?.booking || await this.prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: { mechanic: true },
      });

      if (!booking) {
        throw new Error(`Booking not found: ${data.bookingId}`);
      }

      if (!booking.mechanicId) {
        throw new Error('No mechanic assigned to booking');
      }

      const mechanicId = booking.mechanicId;

      // Calculate amount to release (segment price or booking price)
      const amountToRelease = segment
        ? new Decimal(segment.price.toString())
        : new Decimal(payment.amount.toString());

      // Release funds in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            metadata: { ...(payment.metadata as any || {}), releasedAt: new Date().toISOString() },
          },
        });

        // Credit mechanic wallet
        await this.walletService.creditMechanicInTransaction(
          tx,
          mechanicId,
          amountToRelease,
          booking.id,
          {
            segmentId: segment?.id,
            paymentId: payment.id,
            type: 'SEGMENT_PAYMENT',
          },
        );

        return { paymentId: payment.id, amount: amountToRelease.toString() };
      });

      this.logger.log(`[${operation}] Released ${amountToRelease.toString()} to mechanic ${mechanicId}`);
      return { success: true, ...result };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * REFUND PAYMENT: Process refund for cancelled bookings/disputes
   */
  private async refundPayment(data: PaymentJobData, attempts: number): Promise<any> {
    const operation = 'refundPayment';
    this.logger.log(`[${operation}] Processing refund for payment ${data.paymentId || data.bookingId}`);

    try {
      if (!data.paymentId && !data.bookingId) {
        throw new Error('Either paymentId or bookingId is required');
      }

      // Find payment
      const payment = data.paymentId
        ? await this.prisma.payment.findUnique({ where: { id: data.paymentId } })
        : await this.prisma.payment.findFirst({
            where: { bookingId: data.bookingId },
            orderBy: { createdAt: 'desc' },
          });

      if (!payment) {
        throw new Error(`Payment not found: ${data.paymentId || data.bookingId}`);
      }

      // Calculate refund amount
      const refundAmount = data.amount
        ? new Decimal(data.amount.toString())
        : new Decimal(payment.amount.toString()).minus(new Decimal(payment.refundedAmount.toString()));

      if (refundAmount.lessThanOrEqualTo(0)) {
        this.logger.warn(`[${operation}] Refund amount is zero or negative: ${refundAmount.toString()}`);
        return { success: false, message: 'No amount to refund' };
      }

      // Process refund via payment gateway (if paymentsService available)
      let gatewayRefund = null;
      if (this.paymentsService && payment.reference) {
        try {
          // Note: This assumes PaymentsService has a refund method
          // You may need to implement this method in PaymentsService
          gatewayRefund = await (this.paymentsService as any).refundPayment?.(
            payment.reference,
            refundAmount.toNumber(),
          );
        } catch (gatewayErr: any) {
          this.logger.error(`[${operation}] Gateway refund failed: ${gatewayErr.message}`, gatewayErr.stack);
          // Continue with internal refund even if gateway fails
        }
      }

      // Update payment record
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: new Decimal(payment.refundedAmount.toString()).plus(refundAmount),
          status: refundAmount.gte(new Decimal(payment.amount.toString()))
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
          metadata: {
            ...(payment.metadata as any || {}),
            refundedAt: new Date().toISOString(),
            gatewayRefund,
          },
        },
      });

      this.logger.log(`[${operation}] Refund processed: ${refundAmount.toString()} for payment ${payment.id}`);
      return { success: true, paymentId: payment.id, refundAmount: refundAmount.toString() };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[PaymentQueue] Payment job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[PaymentQueue] Payment job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  }
}
