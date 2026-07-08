import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { PaymentsService } from 'src/payment/payments.services';
import { RequestPayoutDto, UpdatePayoutStatusDto, ListPayoutsDto } from './dto/payout.dto';
import { Decimal } from 'decimal.js';
import { PayoutStatus, Prisma, Payout } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async requestPayout(
    mechanicId: string,
    dto: RequestPayoutDto,
  ): Promise<{ success: boolean; message: string; data: Payout }> {
    const operation = `Request payout for mechanic ${mechanicId}`;
    this.logger.log(`Starting: ${operation}`);

    return this.prisma.$transaction(async (tx: TransactionClient) => {
      const mechanic = await tx.user.findUnique({
        where: { id: mechanicId },
        select: { id: true, role: true },
      });

      if (!mechanic || mechanic.role !== 'MECHANIC') {
        throw new NotFoundException('Mechanic not found or not eligible for payouts.');
      }

      const wallet = await this.walletService.ensureWallet(mechanicId, tx);
      const amountDecimal = new Decimal(dto.amount);

      if (wallet.balance.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient balance for payout request.');
      }

      const payout = await tx.payout.create({
        data: {
          mechanicId,
          amount: amountDecimal.toString(),
          status: PayoutStatus.PENDING,
        },
      });

      await this.walletService.debitWalletWithTx(
        tx,
        mechanicId,
        amountDecimal,
        'PAYOUT_REQUEST',
        undefined,
        { payoutId: payout.id },
      );

      let transferResult: { success: boolean; message: string; providerRef?: string; rawGatewayResponse?: unknown };
      try {
        transferResult = await this.paymentsService.initiatePayoutTransfer({
          amount: amountDecimal.toNumber(),
          bankAccountNumber: dto.bankAccountNumber,
          bankCode: dto.bankCode,
          recipientName: dto.accountName,
          reference: payout.id,
        });
      } catch (gatewayErr: any) {
        this.logger.error(`Gateway transfer failed: ${gatewayErr.message}`, gatewayErr.stack);
        transferResult = {
          success: false,
          message: gatewayErr.message || 'Gateway initiation failed',
          rawGatewayResponse: gatewayErr,
        };
      }

      const updatedPayout = await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: transferResult.success ? PayoutStatus.PENDING : PayoutStatus.FAILED,
          transactionId: transferResult.providerRef ?? null,
          failureReason: transferResult.success ? null : transferResult.message,
        },
      });

      if (!transferResult.success) {
        await this.walletService.creditWalletWithTx(
          tx,
          mechanicId,
          amountDecimal,
          'PAYOUT_FAILED_REVERSAL',
          undefined,
          { payoutId: payout.id, failureReason: transferResult.message },
        );
      }

      return {
        success: transferResult.success,
        message: transferResult.message,
        data: updatedPayout,
      };
    });
  }

  async markPayoutResult(payoutId: string, updateDto: UpdatePayoutStatusDto): Promise<Payout> {
    const { status, providerRef, failureReason } = updateDto;

    return this.prisma.$transaction(async (tx: TransactionClient) => {
      const payout = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!payout) {
        throw new NotFoundException(`Payout with ID ${payoutId} not found.`);
      }

      if (
        payout.status === PayoutStatus.COMPLETED ||
        payout.status === PayoutStatus.FAILED ||
        payout.status === PayoutStatus.CANCELLED
      ) {
        return payout;
      }

      return tx.payout.update({
        where: { id: payoutId },
        data: {
          status,
          transactionId: providerRef ?? payout.transactionId,
          failureReason: failureReason ?? payout.failureReason,
        },
      });
    });
  }

  async getPayout(payoutId: string): Promise<Payout | null> {
    return this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
  }

  async listPayouts(
    filters: ListPayoutsDto,
  ): Promise<{ data: Payout[]; total: number; page: number; limit: number }> {
    const { mechanicId, status } = filters;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
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
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data: payouts, total, page, limit };
  }
}
