// src/payout/payout.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { PaymentsService } from 'src/modules/payment/payments.service'; // Ensure this path is correct
import { RequestPayoutDto, UpdatePayoutStatusDto, ListPayoutsDto, InitiateTransferResult } from './dtos/payout.dtos'; // Updated DTO imports
import { Decimal } from 'decimal.js'; // ⬅️ Import Decimal.js (use the library, not Prisma's runtime Decimal)
import { PayoutStatus, Prisma, Payout, User } from '@prisma/client'; // ⬅️ Import PayoutStatus enum, Payout model, User model

// Define TransactionClient type for consistency
type TransactionClient = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Requests a payout from a mechanic's wallet, handles internal debit,
   * creates a payout record, and initiates the external bank transfer.
   *
   * @param mechanicId The ID of the mechanic requesting the payout.
   * @param dto The payout request details (amount, bank info).
   * @returns A result object indicating success/failure and the updated payout.
   * @throws BadRequestException for invalid input or insufficient balance.
   * @throws NotFoundException if mechanic or associated wallet is not found.
   * @throws InternalServerErrorException for unexpected errors during the process.
   */
  async requestPayout(mechanicId: string, dto: RequestPayoutDto): Promise<{ success: boolean; message: string; data: Payout }> {
    const operation = `Request payout for mechanic ${mechanicId} for amount ${dto.amount}`;
    this.logger.log(`Starting: ${operation}`);

    // Use a Prisma transaction to ensure atomicity of wallet debit and payout record creation
    return this.prisma.$transaction(async (tx: TransactionClient) => {
      let payoutRecord: Payout | null = null; // Declare payoutRecord to be accessible in catch block

      try {
        // 1. Verify mechanic and their wallet
        const mechanic = await tx.user.findUnique({
          where: { id: mechanicId },
          select: { id: true, role: true },
        });

        if (!mechanic || mechanic.role !== 'MECHANIC') {
          this.logger.warn(`[${operation}] Mechanic with ID ${mechanicId} not found or is not a mechanic.`);
          throw new NotFoundException('Mechanic not found or not eligible for payouts.');
        }

        const wallet = await this.walletService.ensureWallet(mechanicId, tx);

        // Convert DTO amount (string) to Decimal for arithmetic operations
        const amountDecimal = new Decimal(dto.amount);

        // Check for sufficient balance before attempting debit
        if (wallet.balance.lessThan(amountDecimal)) {
          throw new BadRequestException('Insufficient balance for payout request.');
        }

        // 2. Create a Payout record with initial PENDING status (or REQUESTED if you add it to enum)
        payoutRecord = await tx.payout.create({ // Use tx for the payout creation
          data: {
            mechanicId,
            walletId: wallet.id, // Associate payout with the wallet
            amount: amountDecimal, // Store Decimal in the Payout model
            status: PayoutStatus.PENDING, // Initial status
            bankAccountNumber: dto.bankAccountNumber,
            bankCode: dto.bankCode,
            bankName: dto.bankName,
            accountName: dto.accountName,
            metadata: {}, // Use for any other provider-specific or dynamic data
          },
        });
        this.logger.log(`Payout record ${payoutRecord.id} created with status ${payoutRecord.status}.`);


        // 3. Debit the mechanic's wallet (internally)
        // This will create a WalletTransaction automatically, linking to the payout
        await this.walletService.debitWalletWithTx(
          tx,
          mechanicId,
          amountDecimal,
          'PAYOUT_REQUEST', // Specific transaction type
          undefined, // No booking ID for payouts
          {
            payoutId: payoutRecord.id, // Link wallet transaction to the actual payout ID
            bankAccountNumber: dto.bankAccountNumber,
            bankCode: dto.bankCode,
          },
        );
        this.logger.log(`Wallet ${wallet.id} debited by ${amountDecimal.toFixed(2)} for payout ${payoutRecord.id}.`);


        // 4. Initiate the actual bank transfer via PaymentsService (gateway)
        let transferResult: InitiateTransferResult;
        try {
          transferResult = await this.paymentsService.initiatePayoutTransfer(
            mechanicId,
            amountDecimal, // Pass Decimal amount
            dto.bankAccountNumber,
            dto.bankCode,
            payoutRecord.id, // Link the transfer to the internal payout record
            dto.bankName,
            dto.accountName,
          );
          this.logger.log(`Gateway transfer initiated for payout ${payoutRecord.id}. Gateway ref: ${transferResult.providerRef || 'N/A'}. Success: ${transferResult.success}`);
        } catch (gatewayErr: any) {
          this.logger.error(`[${operation}] Gateway transfer initiation failed for payout ${payoutRecord.id}: ${gatewayErr.message}`, gatewayErr.stack);
          transferResult = {
            success: false,
            message: gatewayErr.message || 'Gateway initiation failed',
            rawGatewayResponse: gatewayErr.response || gatewayErr,
          };
        }


        // 5. Update payout status based on immediate gateway response
        const newStatusOnGatewayResult = transferResult.success ? PayoutStatus.PROCESSING : PayoutStatus.FAILED;

        const updatedPayout = await tx.payout.update({ // Use tx here
          where: { id: payoutRecord.id },
          data: {
            status: newStatusOnGatewayResult,
            providerRef: transferResult.providerRef,
            rawGatewayResponse: transferResult.rawGatewayResponse,
            failureReason: transferResult.message, // If it failed immediately
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Payout ${updatedPayout.id} status updated to ${updatedPayout.status} after gateway initiation.`);


        // If transfer failed immediately, re-credit the wallet in the same transaction
        if (!transferResult.success) {
          this.logger.warn(`[${operation}] Immediate gateway failure for payout ${payoutRecord.id}. Re-crediting wallet.`);
          await this.walletService.creditWalletWithTx(
            tx,
            mechanicId,
            amountDecimal,
            'PAYOUT_FAILED_REVERSAL', // Transaction type for immediate reversal
            undefined,
            { payoutId: payoutRecord.id, failureReason: transferResult.message },
          );
          this.logger.log(`Re-credited wallet ${wallet.id} with ${amountDecimal.toFixed(2)} due to immediate gateway failure for payout ${payoutRecord.id}.`);
        }

        return { success: transferResult.success, message: transferResult.message, data: updatedPayout };

      } catch (err: any) {
        this.logger.error(`${operation} failed: ${err.message}`, err.stack);

        // If a payout record was created but the transaction failed later (e.g., gateway failed)
        // and it wasn't immediately re-credited, we might need a separate compensation mechanism
        // or a manual review. For immediate gateway failures, we re-credit above.
        // If the entire transaction fails before gateway initiation (e.g., wallet debit fails),
        // the transaction will rollback, ensuring no partial state.

        if (err instanceof BadRequestException || err instanceof NotFoundException) {
          throw err;
        }
        throw new InternalServerErrorException('Payout request failed due to an unexpected error.', err.message);
      }
    });
  }

  /**
   * Called by PaymentsService (via webhook) to mark a payout as successful, failed, or reversed.
   * This method ensures idempotency and correct wallet adjustments for final statuses.
   *
   * @param payoutId The ID of the internal payout record.
   * @param status The final status of the payout (SUCCESS, FAILED, or REVERSED).
   * @param updateDto DTO containing providerRef, failureReason, rawGatewayResponse.
   * @returns The updated Payout object.
   * @throws NotFoundException if the payout is not found.
   * @throws BadRequestException if the status transition is invalid.
   * @throws InternalServerErrorException for unexpected errors.
   */
  async markPayoutResult(
    payoutId: string,
    updateDto: UpdatePayoutStatusDto, // Use DTO for status update
  ): Promise<Payout> {
    const { status, providerRef, failureReason, rawGatewayResponse } = updateDto;
    const operation = `Mark payout ${payoutId} as ${status}`;
    this.logger.log(`Starting: ${operation}. Provider Ref: ${providerRef || 'N/A'}`);

    return this.prisma.$transaction(async (tx: TransactionClient) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { wallet: true, mechanic: true }, // Include relations for context/re-crediting
      });

      if (!payout) {
        throw new NotFoundException(`Payout with ID ${payoutId} not found.`);
      }

      // Idempotency check: Don't re-process if already in a final state (SUCCESS, FAILED, REVERSED)
      if (
        payout.status === PayoutStatus.COMPLETED || // Renamed from SUCCESS to COMPLETED in your enum
        payout.status === PayoutStatus.FAILED ||
        payout.status === PayoutStatus.REVERSED ||
        payout.status === PayoutStatus.CANCELLED // Also consider if CANCELLED is a final state
      ) {
        this.logger.warn(`${operation} already has final status ${payout.status}. Skipping update.`);
        return payout;
      }

      // Validate status transition (optional, but good practice)
      // Example: Cannot go from COMPLETED to FAILED
      // This is simpler for a webhook; trust the webhook's final status.

      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status,
          providerRef: providerRef || payout.providerRef, // Update if new, keep if not provided
          failureReason: failureReason || payout.failureReason,
          rawGatewayResponse: rawGatewayResponse || payout.rawGatewayResponse,
          updatedAt: new Date(),
        },
      });
      this.logger.log(`Payout ${payoutId} updated to ${status}.`);

      // If payout failed or was reversed, re-credit the mechanic's wallet
      // IMPORTANT: Only re-credit if it wasn't already re-credited due to immediate gateway failure.
      // This requires tracking if a reversal transaction already occurred for this payout.
      // A more robust way might involve a "pending_payout_amount" in the wallet.
      // For simplicity, we'll check the current status of the payout. If it was already
      // FAILED from the initial request, we wouldn't re-credit again here.
      if (
        (status === PayoutStatus.FAILED || status === PayoutStatus.REVERSED) &&
        (payout.status !== PayoutStatus.FAILED && payout.status !== PayoutStatus.REVERSED) // Only re-credit if it wasn't already a final failed state
      ) {
        if (!payout.mechanicId) { // Check for mechanicId through the relation
          this.logger.error(`Payout ${payoutId} failed/reversed, but no mechanicId found to re-credit.`);
          throw new InternalServerErrorException('Cannot re-credit wallet: no mechanic associated with payout.');
        }

        const amountToReCredit = new Decimal(payout.amount); // amount is already Decimal in the model

        await this.walletService.creditWalletWithTx(
          tx,
          payout.mechanicId, // Use mechanicId from the payout
          amountToReCredit,
          status === PayoutStatus.FAILED ? 'PAYOUT_REVERSAL_FAILED' : 'PAYOUT_REVERSAL_REVERSED',
          undefined,
          { payoutId: payout.id, failureReason: failureReason || 'Gateway failure (webhook)' },
        );
        this.logger.log(`Re-credited wallet for mechanic ${payout.mechanicId} with ${amountToReCredit.toFixed(2)} due to ${status} payout ${payoutId}.`);
      }

      return updatedPayout;
    });
  }

  /**
   * Admin: Retrieves payout details by ID.
   *
   * @param payoutId The ID of the payout.
   * @returns The Payout object with associated wallet and mechanic details.
   */
  async getPayout(payoutId: string): Promise<Payout | null> {
    return this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { wallet: true, mechanic: true },
    });
  }

  /**
   * Admin: Lists payouts with optional filtering and pagination.
   *
   * @param filters Filtering criteria (mechanicId, status).
   * @returns A paginated list of Payout objects.
   */
  async listPayouts(filters: ListPayoutsDto): Promise<{ data: Payout[]; total: number; page: number; limit: number }> {
    const { mechanicId, status, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where: Prisma.PayoutWhereInput = {};

    if (mechanicId) where.mechanicId = mechanicId;
    if (status) where.status = status;

    const [payouts, total] = await this.prisma.$transaction([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { mechanic: true, wallet: true }, // Include wallet for context
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data: payouts, total, page, limit };
  }
}