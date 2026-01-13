import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../paymnet/payment.services'; // Corrected typo if needed: payment.service.ts
import { AuditService } from 'src/audit/audit.service';
import { Dispute, DisputeStatus } from '@prisma/client'; // Import Dispute and DisputeStatus enum
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal for type safety

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    private readonly auditService: AuditService,
  ) {}

  // ------------------------------------
  // 1. RAISE DISPUTE (STATUS: PENDING)
  // ------------------------------------
  /**
   * Raises a new dispute for a given booking.
   *
   * @param userId The ID of the user raising the dispute (customer or mechanic).
   * @param bookingId The ID of the booking the dispute is related to.
   * @param reason The reason for the dispute.
   * @returns The newly created Dispute object.
   * @throws NotFoundException if the booking is not found.
   * @throws ForbiddenException if a pending dispute already exists for the booking.
   * @throws InternalServerErrorException if the dispute creation fails.
   */
  async raiseDispute(userId: string, bookingId: string, reason: string): Promise<Dispute> {
    const operation = `Raise dispute for booking ${bookingId}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}.`);

    // 1. Validation
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { disputes: true },
    });
    if (!booking) {
      this.logger.warn(`[${operation}] Booking ${bookingId} not found.`);
      throw new NotFoundException('Booking not found');
    }

    // Prevent duplicate pending disputes
    if (booking.disputes.some(d => d.status === DisputeStatus.PENDING)) {
      this.logger.warn(`[${operation}] A pending dispute already exists for booking ${bookingId}.`);
      throw new ForbiddenException('A pending dispute already exists for this booking.');
    }

    // 2. Creation
    try {
      const dispute = await this.prisma.dispute.create({
        data: {
          userId,
          bookingId,
          reason,
          status: DisputeStatus.PENDING, // Use the DisputeStatus enum
        },
      });

      // Audit Trail
      await this.auditService.log(
        userId,
        'RAISE_DISPUTE',
        'DISPUTE', // Resource type
        dispute.id,
        { bookingId, reason, status: DisputeStatus.PENDING } // Include relevant details
      );
      this.logger.log(`[${operation}] Dispute ${dispute.id} created successfully.`);
      return dispute;
    } catch (error) {
      this.logger.error(`[${operation}] failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to record dispute.');
    }
  }

  // ------------------------------------
  // 2. RESOLVE DISPUTE (CORE FINANCIAL LOGIC)
  // ------------------------------------
  /**
   * Resolves an existing dispute, handling financial transactions.
   *
   * @param disputeId The ID of the dispute to resolve.
   * @param resolution The resolution statement or outcome.
   * @param refundAmount The amount to potentially refund, as a number (will be converted to Decimal).
   * @param isRefundToCustomer If true, initiates a refund to the customer via payment gateway.
   * @param isDebitMechanic If true, debits the mechanic's internal wallet.
   * @returns The updated Dispute object after resolution.
   * @throws NotFoundException if the dispute is not found.
   * @throws ForbiddenException if the dispute is not in PENDING status.
   * @throws InternalServerErrorException if financial transactions or dispute update fail.
   * @throws BadRequestException if refundAmount is negative.
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    refundAmount: number, // Still accept number from controller/input, convert to Decimal
    isRefundToCustomer: boolean,
    isDebitMechanic: boolean,
  ): Promise<Dispute> {
    const adminUserId = 'SYSTEM_ADMIN_ID'; // Placeholder for the admin user resolving the dispute
    const operation = `Resolve dispute ${disputeId}`;
    this.logger.log(`[${operation}] Initiated. Refund: ${refundAmount}, RefundToCustomer: ${isRefundToCustomer}, DebitMechanic: ${isDebitMechanic}`);

    // 1. Fetch and Validate Dispute Status/Data
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          select: { id: true, customerId: true, mechanicId: true, paymentId: true },
        },
      },
    });
    if (!dispute) {
      this.logger.warn(`[${operation}] Dispute ${disputeId} not found.`);
      throw new NotFoundException('Dispute not found');
    }
    if (dispute.status !== DisputeStatus.PENDING) { // Use enum
      this.logger.warn(`[${operation}] Dispute ${disputeId} is not pending (current status: ${dispute.status}).`);
      throw new ForbiddenException('Dispute already resolved or cannot be resolved.');
    }
    if (!dispute.booking) {
      this.logger.error(`[${operation}] Dispute ${disputeId} is not linked to a valid booking.`);
      throw new InternalServerErrorException('Dispute is not linked to a valid booking.');
    }
    if (refundAmount < 0) {
      this.logger.warn(`[${operation}] Invalid refund amount: ${refundAmount}.`);
      throw new BadRequestException('Refund amount must be non-negative.');
    }

    const { paymentId, mechanicId } = dispute.booking;
    const decimalRefundAmount = new Decimal(refundAmount); // Convert to Decimal for accuracy

    try {
      // 2. FINANCIAL RESOLUTION (Executed atomically)
      const updatedDispute = await this.prisma.$transaction(async (tx) => {
        if (decimalRefundAmount.greaterThan(0)) { // Use Decimal's greaterThan method
          if (isRefundToCustomer) {
            // Refund customer via original payment method
            if (!paymentId) {
              this.logger.error(`[${operation}] Cannot refund: Payment reference missing for booking ${dispute.booking.id}.`);
              throw new InternalServerErrorException('Cannot refund: Payment reference missing.');
            }

            // The payment service handles the gateway API call
            await this.paymentService.refundPayment(paymentId, decimalRefundAmount.toNumber()); // payment service might expect number
            this.logger.log(`[${operation}] Customer refund initiated for ${decimalRefundAmount} via gateway.`);
          }

          if (isDebitMechanic) {
            // Debit mechanic's internal wallet (e.g., as penalty or adjustment)
            await this.walletService.debitWalletWithTx(
              tx,
              mechanicId,
              decimalRefundAmount, // Pass Decimal to wallet service if it expects it
              'DISPUTE_DEBIT',
              dispute.bookingId,
            );
            this.logger.log(`[${operation}] Mechanic ${mechanicId} debited ${decimalRefundAmount} from wallet.`);
          }
        }

        // 3. UPDATE DISPUTE STATUS (Must occur after financial action succeeds)
        return tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: DisputeStatus.RESOLVED, // Use enum
            resolution,
            updatedAt: new Date(),
            resolvedAmount: decimalRefundAmount, // Save Decimal value
          },
        });
      });

      // Audit Trail
      await this.auditService.log(
        adminUserId,
        'RESOLVE_DISPUTE',
        'DISPUTE', // Resource type
        disputeId,
        { resolution, refundAmount: decimalRefundAmount.toNumber(), isRefundToCustomer, isDebitMechanic, status: DisputeStatus.RESOLVED }
      );
      this.logger.log(`[${operation}] Dispute ${disputeId} successfully resolved.`);
      return updatedDispute;
    } catch (error) {
      this.logger.error(`[${operation}] failed during financial step or transaction: ${error.message}`, error.stack);
      // Re-throw specific client errors if they are already caught and determined
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Resolution failed: Financial transaction or database update could not be completed.');
    }
  }

  // ------------------------------------
  // 3. LIST DISPUTES (For Admin UI)
  // ------------------------------------
  /**
   * Retrieves a list of disputes, typically pending ones for review.
   *
   * @returns An array of Dispute objects, including related user and booking details.
   * @throws InternalServerErrorException if the retrieval fails.
   */
  async listAll(): Promise<Dispute[]> {
    try {
      this.logger.log('Listing all pending disputes.');
      return this.prisma.dispute.findMany({
        where: { status: DisputeStatus.PENDING }, // Filter by PENDING status using enum
        include: { user: true, booking: true },
        orderBy: { createdAt: 'asc' }, // Order for easier review
      });
    } catch (error) {
      this.logger.error(`Failed to list disputes: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve disputes.');
    }
  }

  /**
   * Retrieves a single dispute by ID.
   *
   * @param disputeId The ID of the dispute.
   * @returns The Dispute object or null if not found.
   */
  async getDisputeById(disputeId: string): Promise<Dispute | null> {
    try {
      return this.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { user: true, booking: true },
      });
    } catch (error) {
      this.logger.error(`Failed to get dispute ${disputeId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve dispute details.');
    }
  }
}