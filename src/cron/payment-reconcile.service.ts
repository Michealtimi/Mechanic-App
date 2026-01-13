import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';
import { PaymentsService } from 'src/modules/payment/payments.service';
import { PaymentStatus, BookingStatus } from '@prisma/client'; // Import enums
import { ConfigService } from '@nestjs/config'; // For configuration

@Injectable()
export class PaymentReconcileService implements OnModuleInit {
  private readonly logger = new Logger(PaymentReconcileService.name);
  private reconcileBatchSize: number; // Configurable batch size

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService, // Renamed 'payments' to 'paymentsService' for consistency
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.reconcileBatchSize = this.configService.get<number>('PAYMENT_RECONCILE_BATCH_SIZE', 200);
    this.logger.log(`Payment reconciliation batch size: ${this.reconcileBatchSize}.`);
  }

  // Runs every day at midnight (00:00). Consider running more frequently for critical payments,
  // e.g., EVERY_HOUR or even EVERY_30_MINUTES, depending on business needs.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // Alternative: @Cron(CronExpression.EVERY_HOUR)
  async handleReconciliationCron() {
    this.logger.log('Starting cron job: Payment Reconciliation.');
    await this.reconcileStuckPayments();
    this.logger.log('Finished cron job: Payment Reconciliation.');
  }

  async reconcileStuckPayments() {
    this.logger.log('Running reconcileStuckPayments task...');

    try {
      // Find payments that are in a transient/unresolved state.
      // Filter by a reasonable age (e.g., createdAt earlier than 30 mins ago) to avoid
      // processing payments that are still genuinely 'pending' due to recent user activity
      // or delayed webhooks. The BookingCleanupService handles older 'PENDING' payments.
      const cutoffDate = new Date(Date.now() - (this.configService.get<number>('PAYMENT_RECONCILE_AGE_MINUTES', 30) * 60 * 1000));

      const paymentsToReconcile = await this.prisma.payment.findMany({
        where: {
          status: {
            in: [
              PaymentStatus.INITIATED, // Assuming you have this status
              PaymentStatus.PENDING,
              PaymentStatus.AUTHORIZED, // If you capture later
            ],
          },
          createdAt: { lt: cutoffDate } // Only reconcile payments older than a certain threshold
        },
        take: this.reconcileBatchSize, // Limit the batch size
        orderBy: { createdAt: 'asc' }, // Process oldest first
        include: { booking: true } // Include booking to check its status if needed
      });

      if (paymentsToReconcile.length === 0) {
        this.logger.log('No stuck payments found to reconcile.');
        return;
      }

      this.logger.log(`Found ${paymentsToReconcile.length} stuck payments for reconciliation.`);

      for (const payment of paymentsToReconcile) {
        const operation = `Reconciliation for payment ${payment.id} (Ref: ${payment.reference})`;
        this.logger.log(`Attempting: ${operation}`);

        try {
          // Use the central verifyPayment method from PaymentsService.
          // This method already handles:
          // - Calling the payment gateway
          // - Updating the payment status in your DB
          // - Triggering post-payment actions (like crediting wallets, updating booking status)
          // - Handling amount mismatches
          const verificationResult = await this.paymentsService.verifyPayment(payment.reference);

          // The verifyPayment method should handle the DB updates, so we just log the outcome here
          this.logger.log(
            `✅ ${operation} completed. Gateway status: ${verificationResult.status}. ` +
            `Amount: ${verificationResult.amount}.`
          );

        } catch (err: any) {
          // The verifyPayment method will throw if it explicitly failed or is still pending.
          // We can log this failure and move on.
          this.logger.error(`❌ ${operation} failed: ${err.message}`, err.stack);

          // Optional: If verifyPayment explicitly returned a "FAILED" or "CANCELLED" status
          // and didn't update the DB due to some error, you might want to manually update
          // the local payment status to FAILED here to prevent it from being re-processed
          // indefinitely by reconciliation if verification keeps failing.
          // However, verifyPayment should ideally handle this itself.
          // For now, we trust verifyPayment to update the DB for explicit FAILURES/CANCELLATIONS.
        }
      }
      this.logger.log('Finished reconcileStuckPayments task.');
    } catch (error: any) {
      this.logger.error(`Error during reconcileStuckPayments cron job: ${error.message}`, error.stack);
    }
  }
}