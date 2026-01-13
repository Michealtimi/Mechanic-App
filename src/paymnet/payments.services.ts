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
    private readonly metrics: MetricsService,
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

      const result = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
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
      include: { booking: true },
    });

    if (payment.booking) {
      // 1. Update Booking
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { 
          status: BookingStatus.CONFIRMED, 
          paymentStatus: PrismaPaymentStatus.SUCCESS 
        },
      });

      // 2. Credit Wallet
      if (payment.booking.mechanicId) {
        await this.walletService.creditMechanicWithTx(tx, payment.booking.mechanicId, payment.amount, payment.bookingId);
      }

      // 3. Notify
      await this.notificationGateway.emitBookingConfirmed(payment.booking.customerId, payment.booking.id);
    }
  }
}