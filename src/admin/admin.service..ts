// src/modules/admin/admin.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ResolveDisputeDto, QueryDisputesDto, QueryWalletsDto, QueryPaymentsDto } from './admin.dto'; // Updated DTO imports
import { DisputeService } from 'src/dispute/dispute.service';
import { WalletService } from 'src/wallet/wallet.service';
import { Dispute, Wallet, Payment, Prisma, DisputeStatus } from '@prisma/client'; // Import necessary Prisma types
import { Decimal } from 'decimal.js'; // Use decimal.js for financial calculations
import { PaymentsService } from 'src/paymnet/payments.services';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly disputeService: DisputeService,
    private readonly paymentsService: PaymentsService, // Corrected name: paymentsService
    private readonly walletService: WalletService,
  ) {}

  /**
   * Admin method to resolve a dispute, handling financial adjustments.
   *
   * @param disputeId The ID of the dispute to resolve.
   * @param dto The resolution details including refund/debit instructions.
   * @returns The updated Dispute object.
   * @throws NotFoundException if dispute is not found.
   * @throws BadRequestException if amounts are invalid or dispute is already resolved.
   * @throws InternalServerErrorException for financial transaction errors or unexpected issues.
   */
  async resolveDispute(disputeId: string, dto: ResolveDisputeDto): Promise<Dispute> {
    const operation = `Resolving dispute ID: ${disputeId}`;
    this.logger.log(`Starting: ${operation} with data: ${JSON.stringify(dto)}`);

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { booking: { include: { payment: true } } }, // Include payment for refund reference
      });

      if (!dispute) {
        throw new NotFoundException('Dispute not found.');
      }
      if (dispute.status !== DisputeStatus.PENDING) {
        throw new BadRequestException(`Dispute is already ${dispute.status}. Cannot resolve a non-pending dispute.`);
      }

      // Ensure refund/debit amount is positive if requested
      if ((dto.refundToCustomer || dto.debitMechanic) && dto.refundAmount <= 0) {
        throw new BadRequestException('Refund/debit amount must be greater than zero if requested.');
      }

      // Convert amount to Decimal for financial operations
      const amountDecimal = new Decimal(dto.refundAmount);

      // 1. Perform Financial Adjustments (Refund/Debit)
      try {
        if (dto.refundToCustomer && dispute.booking?.payment?.reference) {
          await this.paymentsService.refundPayment(tx, dispute.booking.payment.reference, amountDecimal);
          this.logger.log(`Refund of ${amountDecimal.toFixed(2)} initiated for customer ${dispute.userId} related to payment ${dispute.booking.payment.reference}.`);
        } else if (dto.refundToCustomer && !dispute.booking?.payment?.reference) {
          this.logger.warn(`[${operation}] Refund requested for customer, but no payment reference found for booking ${dispute.bookingId}. Skipping external refund.`);
          // Potentially handle this as a wallet credit if no external refund possible
        }

        if (dto.debitMechanic && dispute.mechanicId && amountDecimal.greaterThan(0)) {
          // Debit the mechanic's wallet
          await this.walletService.debitWalletWithTx(
            tx,
            dispute.mechanicId,
            amountDecimal,
            'DISPUTE_DEBIT',
            dispute.bookingId,
            { disputeId: dispute.id, resolution: dto.resolution }
          );
          this.logger.log(`Wallet debit of ${amountDecimal.toFixed(2)} processed for mechanic ${dispute.mechanicId}.`);
        }
      } catch (financialErr: any) {
        this.logger.error(`Financial operation failed during resolution: ${financialErr.message}`, financialErr.stack);
        throw new InternalServerErrorException(`Resolution failed: Financial transaction error (${financialErr.message}). Transaction rolled back.`);
      }

      // 2. Update Dispute Status and Record Resolution
      const resolvedDispute = await this.disputeService.updateDisputeStatus(
        tx, // Pass transaction client
        disputeId,
        DisputeStatus.RESOLVED, // Use enum
        dto.resolution,
        amountDecimal, // Store the resolved amount
      );

      this.logger.log(`✅ ${operation} completed successfully. Dispute ${disputeId} status: ${resolvedDispute.status}.`);
      return resolvedDispute;
    });
  }

  /**
   * Admin method to process a refund for a specific payment.
   *
   * @param paymentId The ID of the payment record.
   * @param amount The amount to refund (as a number).
   * @returns The updated Payment object after refund.
   * @throws NotFoundException if the payment is not found.
   * @throws InternalServerErrorException for refund processing errors.
   */
  async refundPayment(paymentId: string, amount: number): Promise<Payment> {
    const operation = `Admin initiated refund for payment ID: ${paymentId} for amount ${amount}`;
    this.logger.log(`Starting: ${operation}`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Get Payment details (e.g., payment reference needed by the gateway)
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        throw new NotFoundException('Payment record not found.');
      }

      // Validate refund amount against original payment amount and already refunded amount
      const amountDecimal = new Decimal(amount);
      if (amountDecimal.lessThanOrEqualTo(0) || amountDecimal.greaterThan(new Decimal(payment.amount).minus(payment.refundedAmount))) {
        throw new BadRequestException('Invalid refund amount. Must be positive and not exceed remaining refundable amount.');
      }

      // 2. Delegate the refund processing to the PaymentService
      const result = await this.paymentsService.refundPayment(tx, payment.reference, amountDecimal);

      this.logger.log(`✅ ${operation} completed successfully.`);
      return result;
    });
  }

  /**
   * Admin method to list disputes with optional filtering and pagination.
   *
   * @param query Filtering and pagination parameters.
   * @returns A paginated list of disputes.
   */
  async listDisputes(query: QueryDisputesDto): Promise<{ data: Dispute[]; total: number; page: number; limit: number }> {
    const { status, customerId, mechanicId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {};
    if (status) where.status = status;
    if (customerId) where.userId = customerId; // Assuming userId in dispute is customerId
    if (mechanicId) where.mechanicId = mechanicId;

    const [disputes, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, mechanic: true, booking: true }, // Include related data
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return { data: disputes, total, page, limit };
  }

  /**
   * Admin method to list all user wallets with optional filtering and pagination.
   *
   * @param query Filtering and pagination parameters.
   * @returns A paginated list of wallets.
   */
  async listWallets(query: QueryWalletsDto): Promise<{ data: Wallet[]; total: number; page: number; limit: number }> {
    const { userId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WalletWhereInput = {};
    if (userId) where.userId = userId;

    const [wallets, total] = await this.prisma.$transaction([
      this.prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true }, // Include user details
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return { data: wallets, total, page, limit };
  }

  /**
   * Admin method to get detailed information for a specific wallet.
   *
   * @param walletId The ID of the wallet (which is linked to a user).
   * @returns The Wallet object with user and transaction details.
   * @throws NotFoundException if the wallet is not found.
   */
  async getWalletDetail(walletId: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true, WalletTransaction: { orderBy: { createdAt: 'desc' }, take: 20 } }, // Include recent transactions
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${walletId} not found.`);
    }
    return wallet;
  }

  /**
   * Admin method to list all payments with optional filtering and pagination.
   *
   * @param query Filtering and pagination parameters.
   * @returns A paginated list of payments.
   */
  async listPayments(query: QueryPaymentsDto): Promise<{ data: Payment[]; total: number; page: number; limit: number }> {
    const { userId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, booking: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: payments, total, page, limit };
  }
}