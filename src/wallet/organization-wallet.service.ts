import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { AuditService } from 'src/audit/audit.service';

type TransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class OrganizationWalletService {
  private readonly logger = new Logger(OrganizationWalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Ensures an organization wallet exists, creating it if necessary
   */
  async ensureWallet(orgId: string, tx?: TransactionClient): Promise<any> {
    const client = tx || this.prisma;
    const operation = `Ensure wallet for org ${orgId}`;

    try {
      let wallet = await client.organizationWallet.findUnique({
        where: { orgId },
      });

      if (!wallet) {
        wallet = await client.organizationWallet.create({
          data: {
            orgId,
            balance: new Decimal(0),
            pending: new Decimal(0),
          },
        });
        this.logger.log(`[${operation}] Created new wallet ${wallet.id}`);
      }

      return wallet;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to ensure organization wallet');
    }
  }

  /**
   * Get organization wallet balance
   */
  async getBalance(orgId: string): Promise<{ balance: Decimal; pending: Decimal }> {
    const operation = `Get balance for org ${orgId}`;
    this.logger.log(`[${operation}]`);

    try {
      const wallet = await this.ensureWallet(orgId);
      return {
        balance: wallet.balance,
        pending: wallet.pending,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get organization wallet balance');
    }
  }

  /**
   * Credit organization wallet
   */
  async creditWallet(
    orgId: string,
    amount: Decimal,
    type: string = 'CREDIT',
    bookingId?: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    const operation = `Credit org ${orgId} with ${amount.toFixed(2)}`;
    this.logger.log(`[${operation}]`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await this.ensureWallet(orgId, tx);

        const updatedWallet = await tx.organizationWallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });

        await tx.walletTransaction.create({
          data: {
            orgWalletId: wallet.id,
            bookingId,
            type,
            amount,
            balanceAfter: updatedWallet.balance,
            metadata,
          },
        });

        // Audit log
        await this.auditService.log({
          actor: 'SYSTEM',
          entity: 'OrganizationWallet',
          entityId: wallet.id,
          action: 'CREDIT',
          after: { balance: updatedWallet.balance.toString(), amount: amount.toString() },
        });

        this.logger.log(`[${operation}] Success. New balance: ${updatedWallet.balance.toFixed(2)}`);
        return updatedWallet;
      });
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to credit organization wallet');
    }
  }

  /**
   * Debit organization wallet
   */
  async debitWallet(
    orgId: string,
    amount: Decimal,
    type: string = 'DEBIT',
    bookingId?: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    const operation = `Debit org ${orgId} with ${amount.toFixed(2)}`;
    this.logger.log(`[${operation}]`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await this.ensureWallet(orgId, tx);

        const currentWallet = await tx.organizationWallet.findUniqueOrThrow({
          where: { id: wallet.id },
        });

        if (currentWallet.balance.lessThan(amount)) {
          throw new BadRequestException('Insufficient organization wallet balance');
        }

        const updatedWallet = await tx.organizationWallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });

        await tx.walletTransaction.create({
          data: {
            orgWalletId: wallet.id,
            bookingId,
            type,
            amount: amount.neg(),
            balanceAfter: updatedWallet.balance,
            metadata,
          },
        });

        // Audit log
        await this.auditService.log({
          actor: 'SYSTEM',
          entity: 'OrganizationWallet',
          entityId: wallet.id,
          action: 'DEBIT',
          after: { balance: updatedWallet.balance.toString(), amount: amount.toString() },
        });

        this.logger.log(`[${operation}] Success. New balance: ${updatedWallet.balance.toFixed(2)}`);
        return updatedWallet;
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to debit organization wallet');
    }
  }

  /**
   * Transfer funds between wallets (user to org, org to user, org to org)
   */
  async transferFunds(
    fromType: 'user' | 'org',
    fromId: string,
    toType: 'user' | 'org',
    toId: string,
    amount: Decimal,
    metadata?: Record<string, any>,
  ): Promise<{ fromBalance: Decimal; toBalance: Decimal }> {
    const operation = `Transfer ${amount.toFixed(2)} from ${fromType} ${fromId} to ${toType} ${toId}`;
    this.logger.log(`[${operation}]`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Debit from source
        if (fromType === 'user') {
          // Use existing WalletService for user wallets
          // This would require injecting WalletService
          throw new BadRequestException('User wallet transfers not yet implemented in this service');
        } else {
          const fromWallet = await this.ensureWallet(fromId, tx);
          const currentFrom = await tx.organizationWallet.findUniqueOrThrow({
            where: { id: fromWallet.id },
          });

          if (currentFrom.balance.lessThan(amount)) {
            throw new BadRequestException('Insufficient balance in source wallet');
          }

          await tx.organizationWallet.update({
            where: { id: fromWallet.id },
            data: { balance: { decrement: amount } },
          });

          await tx.walletTransaction.create({
            data: {
              orgWalletId: fromWallet.id,
              type: 'TRANSFER_OUT',
              amount: amount.neg(),
              balanceAfter: currentFrom.balance.minus(amount),
              metadata: { ...metadata, toType, toId },
            },
          });
        }

        // Credit to destination
        if (toType === 'user') {
          // Use existing WalletService for user wallets
          throw new BadRequestException('User wallet transfers not yet implemented in this service');
        } else {
          const toWallet = await this.ensureWallet(toId, tx);
          const updatedTo = await tx.organizationWallet.update({
            where: { id: toWallet.id },
            data: { balance: { increment: amount } },
          });

          await tx.walletTransaction.create({
            data: {
              orgWalletId: toWallet.id,
              type: 'TRANSFER_IN',
              amount,
              balanceAfter: updatedTo.balance,
              metadata: { ...metadata, fromType, fromId },
            },
          });

          const fromWallet = await tx.organizationWallet.findUnique({
            where: { orgId: fromId },
          });

          // Audit log
          await this.auditService.log({
            actor: 'SYSTEM',
            entity: 'OrganizationWallet',
            entityId: fromWallet?.id || toWallet.id,
            action: 'TRANSFER',
            after: {
              fromOrg: fromId,
              toOrg: toId,
              amount: amount.toString(),
            },
          });

          this.logger.log(`[${operation}] Success`);
          return {
            fromBalance: fromWallet ? fromWallet.balance.minus(amount) : new Decimal(0),
            toBalance: updatedTo.balance,
          };
        }
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to transfer funds');
    }
  }

  /**
   * Get wallet transaction history
   */
  async getTransactions(
    orgId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ transactions: any[]; total: number }> {
    const operation = `Get transactions for org ${orgId}`;
    this.logger.log(`[${operation}]`);

    try {
      const wallet = await this.ensureWallet(orgId);

      const [transactions, total] = await Promise.all([
        this.prisma.walletTransaction.findMany({
          where: { orgWalletId: wallet.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.walletTransaction.count({
          where: { orgWalletId: wallet.id },
        }),
      ]);

      return { transactions, total };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get transactions');
    }
  }

  /**
   * Process bulk payments from organization wallet to multiple recipients
   */
  async processBulkPayments(
    sourceOrgId: string,
    recipients: Array<{
      userId?: string;
      orgId?: string;
      amount: number;
      type?: string;
      metadata?: Record<string, any>;
    }>,
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{ recipient: string; success: boolean; error?: string }>;
  }> {
    const operation = `Process bulk payments from org ${sourceOrgId}`;
    this.logger.log(`[${operation}] Processing ${recipients.length} payments`);

    try {
      // Calculate total amount
      const totalAmount = recipients.reduce(
        (sum, r) => sum.plus(new Decimal(r.amount)),
        new Decimal(0),
      );

      // Verify sufficient balance
      const sourceBalance = await this.getBalance(sourceOrgId);
      if (sourceBalance.balance.lessThan(totalAmount)) {
        throw new BadRequestException(
          `Insufficient balance. Required: ${totalAmount.toFixed(2)}, Available: ${sourceBalance.balance.toFixed(2)}`,
        );
      }

      const results: Array<{ recipient: string; success: boolean; error?: string }> = [];
      let successCount = 0;
      let failedCount = 0;

      // Process each payment in a transaction
      for (const recipient of recipients) {
        try {
          if (recipient.userId) {
            // Transfer to user wallet (would need WalletService integration)
            // For now, we'll skip user wallet transfers in bulk payments
            results.push({
              recipient: `user:${recipient.userId}`,
              success: false,
              error: 'User wallet bulk payments not yet implemented',
            });
            failedCount++;
          } else if (recipient.orgId) {
            // Transfer to organization wallet
            await this.transferFunds(
              'org',
              sourceOrgId,
              'org',
              recipient.orgId,
              new Decimal(recipient.amount),
              {
                ...recipient.metadata,
                bulkPayment: true,
                type: recipient.type || 'BULK_PAYMENT',
              },
            );
            results.push({
              recipient: `org:${recipient.orgId}`,
              success: true,
            });
            successCount++;
          } else {
            results.push({
              recipient: 'unknown',
              success: false,
              error: 'Either userId or orgId must be provided',
            });
            failedCount++;
          }
        } catch (error) {
          results.push({
            recipient: recipient.userId ? `user:${recipient.userId}` : `org:${recipient.orgId}`,
            success: false,
            error: error.message || 'Unknown error',
          });
          failedCount++;
        }
      }

      // Audit log
      await this.auditService.log({
        actor: 'SYSTEM',
        entity: 'OrganizationWallet',
        entityId: sourceOrgId,
        action: 'BULK_PAYMENT',
        after: {
          totalAmount: totalAmount.toString(),
          successCount,
          failedCount,
          recipientsCount: recipients.length,
        },
      });

      this.logger.log(
        `[${operation}] Completed: ${successCount} successful, ${failedCount} failed`,
      );

      return {
        success: successCount,
        failed: failedCount,
        results,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process bulk payments');
    }
  }

  /**
   * Get wallet balance summary and statistics
   */
  async getWalletReport(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    balance: Decimal;
    pending: Decimal;
    totalCredits: Decimal;
    totalDebits: Decimal;
    transactionCount: number;
    recentTransactions: any[];
  }> {
    const operation = `Get wallet report for org ${orgId}`;
    this.logger.log(`[${operation}]`);

    try {
      const wallet = await this.ensureWallet(orgId);

      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = startDate;
        if (endDate) dateFilter.createdAt.lte = endDate;
      }

      const [transactions, totalCredits, totalDebits] = await Promise.all([
        this.prisma.walletTransaction.findMany({
          where: {
            orgWalletId: wallet.id,
            ...dateFilter,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.walletTransaction.aggregate({
          where: {
            orgWalletId: wallet.id,
            type: { in: ['CREDIT', 'TRANSFER_IN'] },
            amount: { gt: 0 },
            ...dateFilter,
          },
          _sum: { amount: true },
        }),
        this.prisma.walletTransaction.aggregate({
          where: {
            orgWalletId: wallet.id,
            type: { in: ['DEBIT', 'TRANSFER_OUT'] },
            amount: { lt: 0 },
            ...dateFilter,
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        balance: wallet.balance,
        pending: wallet.pending,
        totalCredits: new Decimal(totalCredits._sum.amount || 0),
        totalDebits: new Decimal(totalDebits._sum.amount || 0).abs(),
        transactionCount: transactions.length,
        recentTransactions: transactions,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get wallet report');
    }
  }
}
