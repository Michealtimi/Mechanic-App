import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client'; // Import enums for safety
import { PaymentsService } from 'src/payment/payments.services';
import { ConfigService } from '@nestjs/config'; // For configuring cutoff times

@Injectable()
export class BookingCleanupService implements OnModuleInit {
  private readonly logger = new Logger(BookingCleanupService.name);
  private staleBookingCutoffMs: number; // Configurable cutoff time in milliseconds
  private pendingPaymentCutoffMs: number; // Configurable cutoff time for payments

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway, // Renamed 'noti' to 'notificationGateway' for clarity
    private readonly paymentsService: PaymentsService, // Inject PaymentsService
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  onModuleInit() {
    // Load cutoff times from configuration
    // Default to 15 minutes for stale bookings, 30 minutes for pending payments
    this.staleBookingCutoffMs = this.configService.get<number>('BOOKING_STALE_CUTOFF_MINUTES', 15) * 60 * 1000;
    this.pendingPaymentCutoffMs = this.configService.get<number>('PAYMENT_PENDING_CUTOFF_MINUTES', 30) * 60 * 1000;
    this.logger.log(`Stale booking cutoff: ${this.staleBookingCutoffMs / (1000 * 60)} minutes.`);
    this.logger.log(`Pending payment cutoff: ${this.pendingPaymentCutoffMs / (1000 * 60)} minutes.`);
  }

  // Runs every 5 minutes - tune as required
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Starting cron job: Booking and Payment Cleanup.');
    await this.cancelStaleBookings();
    await this.cancelStalePendingPayments(); // New cleanup task
    this.logger.log('Finished cron job: Booking and Payment Cleanup.');
  }

  async cancelStaleBookings() {
    this.logger.log('Running cancelStaleBookings task...');
    const cutoffDate = new Date(Date.now() - this.staleBookingCutoffMs);

    try {
      // Find stale bookings that are still PENDING and older than the cutoff
      const staleBookings = await this.prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING, // Use enum
          createdAt: { lt: cutoffDate },
        },
        include: {
          customer: true, // Include customer to get email/ID for notification
          mechanic: true, // Include mechanic to get ID for notification
          payments: true, // Include related payments if any
        }
      });

      if (staleBookings.length === 0) {
        this.logger.log('No stale bookings found to cancel.');
        return;
      }

      this.logger.log(`Found ${staleBookings.length} stale bookings to cancel.`);

      for (const booking of staleBookings) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // 1. Update Booking Status
            const updatedBooking = await tx.booking.update({
              where: { id: booking.id },
              data: { status: BookingStatus.CANCELLED, updatedAt: new Date() }, // Use enum
            });
            this.logger.log(`Updated booking ${booking.id} to ${BookingStatus.CANCELLED}.`);

            // 2. Handle associated payments (if any)
            const pendingPayments = booking.payments.filter((p) => p.status === PaymentStatus.PENDING);
            for (const pay of pendingPayments) {
              await tx.payment.update({
                where: { id: pay.id },
                data: { status: PaymentStatus.CANCELLED, updatedAt: new Date() },
              });
              this.logger.log(`Updated associated payment ${pay.id} to ${PaymentStatus.CANCELLED}.`);
            }

            // 3. Notify Mechanic and Customer
            if (booking.mechanicId) {
              await this.notificationGateway.emitBookingCancelled(booking.mechanicId, booking.id);
            }
            if (booking.customerId) {
              await this.notificationGateway.emitBookingCancelled(booking.customerId, booking.id);
            }
            this.logger.log(`Notifications sent for cancelled booking ${booking.id}.`);
          });
        } catch (error: any) {
          this.logger.error(`Failed to cancel booking ${booking.id}: ${error.message}`, error.stack);
          // Continue to next booking even if one fails
        }
      }
      this.logger.log('Finished cancelStaleBookings task.');
    } catch (error: any) {
      this.logger.error(`Error during cancelStaleBookings cron job: ${error.message}`, error.stack);
    }
  }

  /**
   * Identifies and cancels/refunds stale PENDING payments that are not linked to a PENDING booking,
   * or whose booking has already been resolved.
   */
  @Cron(CronExpression.EVERY_10_MINUTES) // Run this slightly less frequently or with different timing
  async cancelStalePendingPayments() {
    this.logger.log('Running cancelStalePendingPayments task...');
    const cutoffDate = new Date(Date.now() - this.pendingPaymentCutoffMs);

    try {
      // Find payments that are PENDING and older than the cutoff
      const stalePayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: { lt: cutoffDate },
          // Optionally, also ensure the associated booking (if any) is not PENDING
          // or has already been cancelled/completed/failed.
          OR: [
            { booking: null }, // Payments with no associated booking (shouldn't happen with current flow, but for safety)
            { booking: { status: { not: BookingStatus.PENDING } } } // Payment for a booking that's no longer pending
          ]
        },
        include: {
          booking: true // Include booking to check its status
        }
      });

      if (stalePayments.length === 0) {
        this.logger.log('No stale pending payments found to cancel/refund.');
        return;
      }

      this.logger.log(`Found ${stalePayments.length} stale pending payments to cancel/refund.`);

      for (const payment of stalePayments) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // Attempt to verify the payment first. It might have succeeded recently
            // and the webhook was delayed. VerifyPayment will handle marking it SUCCESS.
            // If it's still PENDING or FAILED after verification, then proceed with cancellation.
            // THIS IS IMPORTANT: verification is the source of truth from the gateway.
            const verified = await this.paymentsService.verifyPayment(payment.reference, payment.gateway);

            if (verified.status === PaymentStatus.SUCCESS || verified.status === PaymentStatus.CAPTURED) {
              this.logger.log(
                `Payment ${payment.id} (${payment.reference}) was actually SUCCESSFUL upon verification. No cancellation needed.`,
              );
              return;
            }

            const mergedRaw = verified.rawGatewayResponse ?? payment.rawGatewayResponse;
            const updatedPayment = await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.CANCELLED,
                updatedAt: new Date(),
                ...(mergedRaw != null && { rawGatewayResponse: mergedRaw as Prisma.InputJsonValue }),
              },
            });
            this.logger.log(`Updated payment ${updatedPayment.id} (${payment.reference}) to ${PaymentStatus.CANCELLED}.`);

            if (payment.userId) {
              await this.notificationGateway.emitPaymentCancelled(payment.userId, payment.id);
            }

          });
        } catch (error: any) {
          this.logger.error(`Failed to cancel stale pending payment ${payment.id}: ${error.message}`, error.stack);
          // Continue to next payment
        }
      }
      this.logger.log('Finished cancelStalePendingPayments task.');
    } catch (error: any) {
      this.logger.error(`Error during cancelStalePendingPayments cron job: ${error.message}`, error.stack);
    }
  }

}