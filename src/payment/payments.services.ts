/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { IPaymentGateway } from './interface/payment-gateway.interface';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { getDefaultCurrency } from 'src/config/platform.config';
import { Prisma, BookingStatus, PaymentStatus as PrismaPaymentStatus, PaymentEventType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { WalletService } from 'src/wallet/wallet.service';
import { createHmac, timingSafeEqual } from 'crypto';
import { Decimal } from 'decimal.js';
import { Role } from '@prisma/client';
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
  gateway?: string;
  countryCode?: string;
  currency?: string;
  metadata: Record<string, any>;
  mechanicSubaccount?: string | null;
  bookingSegmentId?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: PaymentGatewayFactory,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly notificationGateway: NotificationGateway,
    private readonly auditLog: PaymentEventService,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Ensures caller may pay for this booking (customer, fleet org member, or admin).
   */
  async assertCanInitiatePayment(
    userId: string,
    role: string,
    bookingId: string,
  ): Promise<void> {
    if (role === Role.ADMIN || role === Role.SUPERADMIN) {
      return;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { organization: { include: { members: { where: { userId } } } } },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId === userId) {
      return;
    }
    if (booking.orgId && booking.organization?.members?.length) {
      return;
    }
    throw new ForbiddenException('You are not allowed to pay for this booking');
  }

  async assertCanVerifyPayment(
    userId: string,
    role: string,
    reference: string,
  ): Promise<void> {
    if (role === Role.ADMIN || role === Role.SUPERADMIN) {
      return;
    }
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { booking: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.userId === userId || payment.booking?.customerId === userId) {
      return;
    }
    throw new ForbiddenException('You are not allowed to verify this payment');
  }

  // ===============================
  // 1. INITIALIZE PAYMENT
  // ===============================
  async initialize(dto: InitializePaymentDto) {
    const start = Date.now();
    this.metrics.increment('payments_initialized_total');

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { customer: true, organization: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status !== BookingStatus.PENDING) {
 throw new BadRequestException(`Invalid booking status: ${booking.status}`);
      }

      const gateway = this.gatewayFactory.resolve({
        gateway: dto.gateway,
        countryCode: dto.countryCode ?? (dto.metadata?.countryCode as string),
        currency: dto.currency,
      });
      const resolvedGatewayName = this.gatewayFactory.resolveName({
        gateway: dto.gateway,
        countryCode: dto.countryCode,
        currency: dto.currency,
      });

      const gatewayResponse = await gateway.initializePayment({
        amount: Number(dto.amount),
        email: booking.customer.email,
        metadata: {
          ...dto.metadata,
          reference: `BK-${Date.now()}-${dto.bookingId}`,
          currency: dto.currency || getDefaultCurrency(this.configService),
        },
      });

      const bookingWithSegments = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        include: { segments: true },
      });

      const result = await this.prisma.$transaction(async (tx) => {
        if (dto.bookingSegmentId) {
          const segment = bookingWithSegments?.segments.find((s) => s.id === dto.bookingSegmentId);
          if (!segment) {
            throw new NotFoundException(`Segment ${dto.bookingSegmentId} not found`);
          }

          const payment = await tx.payment.create({
            data: {
              bookingId: dto.bookingId,
              bookingSegmentId: dto.bookingSegmentId,
              userId: booking.customerId,
              tenantId: booking.orgId ?? booking.customer?.tenantId ?? null,
              reference: gatewayResponse.reference,
              amount: Number(dto.amount),
              status: 'PENDING',
              gateway: resolvedGatewayName,
              rawGatewayResponse: gatewayResponse.raw,
            },
          });

          try {
            await this.auditLog.recordOrIgnore({
              paymentId: payment.id,
              gateway: resolvedGatewayName,
              gatewayEvent: gatewayResponse.reference,
              type: PaymentEventType.INITIATED,
              rawPayload: gatewayResponse.raw,
            });
          } catch (e) {
            this.logger.error('Logging failed', e);
          }

          return {
            paymentUrl: gatewayResponse.paymentUrl,
            reference: gatewayResponse.reference,
            segmentId: dto.bookingSegmentId,
          };
        }

        const mainPayment = await tx.payment.create({
          data: {
            bookingId: dto.bookingId,
            userId: booking.customerId,
            tenantId: booking.orgId ?? booking.customer?.tenantId ?? null,
            reference: gatewayResponse.reference,
            amount: Number(dto.amount),
            status: 'PENDING',
            gateway: resolvedGatewayName,
            rawGatewayResponse: gatewayResponse.raw,
          },
        });

        if (bookingWithSegments?.segments && bookingWithSegments.segments.length > 0) {
          await Promise.all(
            bookingWithSegments.segments.map((segment) =>
              tx.payment.create({
                data: {
                  bookingId: dto.bookingId,
                  bookingSegmentId: segment.id,
                  userId: booking.customerId,
                  tenantId: booking.orgId ?? booking.customer?.tenantId ?? null,
                  reference: `${gatewayResponse.reference}-SEG-${segment.id}`,
                  amount: segment.price,
                  status: 'PENDING',
                  gateway: resolvedGatewayName,
                  metadata: { parentPaymentId: mainPayment.id, segmentType: segment.type },
                },
              }),
            ),
          );
        }

        try {
          await this.auditLog.recordOrIgnore({
            paymentId: mainPayment.id,
            gateway: resolvedGatewayName,
            gatewayEvent: gatewayResponse.reference,
            type: PaymentEventType.INITIATED,
            rawPayload: gatewayResponse.raw,
          });
        } catch (e) {
          this.logger.error('Logging failed', e);
        }

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
  async verifyPayment(reference: string, gatewayName?: string) {
    const start = Date.now();
    const payment = await this.prisma.payment.findUnique({ where: { reference } });

    if (!payment) throw new NotFoundException('Payment record missing');

    const resolvedGateway = gatewayName ?? payment.gateway ?? 'PAYSTACK';
    const gateway = this.gatewayFactory.resolve({ gateway: resolvedGateway });

    if (payment.status === PrismaPaymentStatus.SUCCESS || payment.status === PrismaPaymentStatus.CAPTURED) {
      return payment;
    }

    const verification = await gateway.verifyPayment(reference);
    const status = verification.status.toUpperCase() as PrismaPaymentStatus;

    const result = await this.prisma.$transaction(async (tx) => {
      try {
        await this.auditLog.recordOrIgnore({
          paymentId: payment.id,
          gateway: resolvedGateway,
          gatewayEvent: `${reference}_v_${Date.now()}`,
          type: PaymentEventType.VERIFIED,
          rawPayload: verification.raw,
        });
      } catch (e) {
        this.logger.error('Audit failed', e);
      }

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          verifiedAt: new Date(),
          rawGatewayResponse: verification.raw,
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
  // 3. WEBHOOK HANDLERS (per provider)
  // ===============================
  async handlePaystackWebhook(signature: string, rawBody: Buffer) {
    const secret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('PAYSTACK_WEBHOOK_SECRET is not configured');
    }
    const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) throw new ForbiddenException('Invalid Paystack signature');

    const payload = JSON.parse(rawBody.toString()) as {
      event?: string;
      data?: { reference?: string; id?: number | string };
    };
    const reference = payload.data?.reference;
    if (!reference) throw new BadRequestException('Paystack webhook missing reference');

    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      this.logger.warn(`Paystack webhook for unknown reference: ${reference}`);
      return;
    }

    const gatewayEvent = String(payload.data?.id ?? `${payload.event}-${reference}`);
    try {
      await this.auditLog.recordOrIgnore({
        paymentId: payment.id,
        gateway: 'PAYSTACK',
        gatewayEvent,
        type: PaymentEventType.WEBHOOK,
        rawPayload: payload,
      });
    } catch (e) {
      this.logger.error('Webhook audit failed', e);
    }

    switch (payload.event) {
      case 'charge.success':
        await this.verifyPayment(reference, 'PAYSTACK');
        break;
      case 'charge.failed':
        this.metrics.increment('payments_failed_total');
        await this.prisma.payment.updateMany({
          where: { reference },
          data: { status: 'FAILED' },
        });
        break;
      case 'refund.success':
        this.logger.log(`Refund detected for ${reference}`);
        break;
      default:
        this.logger.debug(`Unhandled Paystack event: ${payload.event}`);
    }
  }

  async handleFlutterwaveWebhook(signature: string, rawBody: Buffer) {
    const secret = this.configService.get<string>('FLW_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('FLW_WEBHOOK_SECRET is not configured');
    }
    if (!this.secureCompare(signature, secret)) {
      throw new ForbiddenException('Invalid Flutterwave signature');
    }

    const payload = JSON.parse(rawBody.toString()) as {
      event?: string;
      data?: { tx_ref?: string; id?: number | string; status?: string };
    };
    const reference = payload.data?.tx_ref;
    if (!reference) throw new BadRequestException('Flutterwave webhook missing tx_ref');

    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    if (!payment) {
      this.logger.warn(`Flutterwave webhook for unknown reference: ${reference}`);
      return;
    }

    const gatewayEvent = String(payload.data?.id ?? `${payload.event}-${reference}`);
    try {
      await this.auditLog.recordOrIgnore({
        paymentId: payment.id,
        gateway: 'FLUTTERWAVE',
        gatewayEvent,
        type: PaymentEventType.WEBHOOK,
        rawPayload: payload,
      });
    } catch (e) {
      this.logger.error('Flutterwave webhook audit failed', e);
    }

    const ev = (payload.event || '').toLowerCase();
    if (ev === 'charge.completed' || payload.data?.status === 'successful') {
      await this.verifyPayment(reference, 'FLUTTERWAVE');
    } else if (ev.includes('failed') || payload.data?.status === 'failed') {
      this.metrics.increment('payments_failed_total');
      await this.prisma.payment.updateMany({
        where: { reference },
        data: { status: 'FAILED' },
      });
    } else {
      this.logger.debug(`Unhandled Flutterwave event: ${payload.event}`);
    }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    return this.handlePaystackWebhook(signature, rawBody);
  }

  async initiatePayoutTransfer(params: {
    amount: number;
    bankAccountNumber: string;
    bankCode: string;
    recipientName?: string;
    reference: string;
    currency?: string;
    countryCode?: string;
    gateway?: string;
  }): Promise<{
    success: boolean;
    message: string;
    providerRef?: string;
    rawGatewayResponse?: unknown;
  }> {
    const gateway = this.gatewayFactory.resolve({
      gateway: params.gateway,
      countryCode: params.countryCode,
      currency: params.currency,
    });

    const result = await gateway.initiateTransfer({
      amount: Math.round(params.amount),
      bankAccountNumber: params.bankAccountNumber,
      bankCode: params.bankCode,
      recipientName: params.recipientName || 'Recipient',
      internalReference: params.reference,
      currency: params.currency || getDefaultCurrency(this.configService),
      reason: 'Mechanic payout',
    });

    return {
      success: result.success,
      message: result.message || (result.success ? 'Transfer initiated' : 'Transfer failed'),
      providerRef: result.providerRef,
      rawGatewayResponse: result.raw,
    };
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
      await tx.booking.update({
        where: { id: payment.bookingId! },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });

      // Escrow: wallet credit happens only on segment/booking completion (release* methods).
      this.logger.log(
        `Payment ${paymentId} confirmed for booking ${payment.bookingId}; funds held until job completion.`,
      );
    }
  }

  private secureCompare(provided: string, expected: string): boolean {
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Release booking-level payment to mechanic after completion PIN / job done.
   * Idempotent via payment.metadata.released.
   */
  async releaseBookingPayment(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true, segments: true },
    });
    if (!booking?.mechanicId) {
      throw new BadRequestException('No mechanic assigned to booking');
    }

    if (booking.segments.length > 0) {
      this.logger.debug(`Booking ${bookingId} uses segments; skip booking-level release`);
      return { skipped: true, reason: 'segmented_booking' };
    }

    const payment = booking.payments.find(
      (p) => !p.bookingSegmentId && (p.status === PrismaPaymentStatus.SUCCESS || p.status === PrismaPaymentStatus.CAPTURED),
    );
    if (!payment) {
      throw new NotFoundException('No successful booking-level payment found');
    }

    const meta = (payment.metadata as Record<string, unknown>) || {};
    if (meta.released === true) {
      return { alreadyReleased: true, paymentId: payment.id };
    }

    const amount =
      payment.amount instanceof Decimal
        ? payment.amount
        : new Decimal(payment.amount.toString());

    const result = await this.prisma.$transaction(async (tx) => {
      await this.walletService.creditMechanicInTransaction(
        tx,
        booking.mechanicId!,
        amount,
        bookingId,
        { paymentId: payment.id, type: 'BOOKING_PAYMENT' },
      );
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          metadata: { ...meta, released: true, releasedAt: new Date().toISOString() },
        },
      });
      return { paymentId: payment.id, amount: amount.toString(), mechanicId: booking.mechanicId };
    });

    this.logger.log(`Released booking payment ${payment.id} for booking ${bookingId}`);
    return result;
  }

  // ===============================
  // 5. RELEASE SEGMENT PAYMENT
  // ===============================
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

      const segmentPayment = segment.payments.find((p) => p.bookingSegmentId === segmentId);
      if (!segmentPayment) {
        throw new NotFoundException(`Payment not found for segment ${segmentId}`);
      }

      if (
        segmentPayment.status !== PrismaPaymentStatus.SUCCESS &&
        segmentPayment.status !== PrismaPaymentStatus.CAPTURED
      ) {
        throw new BadRequestException(`Payment for segment ${segmentId} is not in SUCCESS/CAPTURED status`);
      }

      const segMeta = (segmentPayment.metadata as Record<string, unknown>) || {};
      if (segMeta.released === true) {
        return { alreadyReleased: true, segmentId, paymentId: segmentPayment.id };
      }

      const result = await this.prisma.$transaction(async (tx) => {
        await this.walletService.creditMechanicInTransaction(
          tx,
          segment.booking.mechanicId!,
          segmentPayment.amount,
          segment.bookingId,
          { segmentId, paymentId: segmentPayment.id, type: 'SEGMENT_PAYMENT' },
        );

        await tx.payment.update({
          where: { id: segmentPayment.id },
          data: {
            metadata: {
              ...segMeta,
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
  // 5b. REFUND
  // ===============================
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
    const gateway = this.gatewayFactory.resolve({ gateway: payment.gateway });
    const result = await gateway.refund(reference, amount);
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

      const segmentStatuses = booking.segments.map((segment) => {
        const segmentPayment = segment.payments.find((p) => p.bookingSegmentId === segment.id);
        const isPaid =
          segmentPayment &&
          (segmentPayment.status === PrismaPaymentStatus.SUCCESS ||
            segmentPayment.status === PrismaPaymentStatus.CAPTURED);

        return {
          segmentId: segment.id,
          status: isPaid ? 'PAID' : 'PENDING',
          amount: segment.price.toString(),
        };
      });

      const totalAmount = booking.totalPrice || booking.price;
      const paidSegments = segmentStatuses.filter((s) => s.status === 'PAID');
      const paidAmount = paidSegments.reduce(
        (sum, seg) => sum.plus(new (require('decimal.js').Decimal)(seg.amount)),
        new (require('decimal.js').Decimal)(0),
      );

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
