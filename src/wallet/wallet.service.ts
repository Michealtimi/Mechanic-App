import { 
  Injectable, 
  InternalServerErrorException, 
  Logger, 
  BadRequestException, // ⬅️ Added for better error translation
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Ensures a wallet exists for a user, creating it if necessary. Idempotent.
   */
  async ensureWallet(userId: string) {
    // NOTE: This still carries a small race condition risk (two users creating simultaneously)
    // but the DB's unique constraint on userId should ultimately prevent duplicates.
    const existing = await this.prisma.wallet.findUnique({ where: { userId }});
    if (existing) return existing;
    return this.prisma.wallet.create({ data: { userId, balance: 0, pending: 0 }});
  }

  /**
   * Safely credits a user's wallet using atomic database operations.
   * @param userId The ID of the user/mechanic to credit.
   * @param amount The amount in the smallest currency unit (e.g., kobo/cents).
   */
  async creditWalletWithTx(
    prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, any>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    userId: string, 
    amount: number, 
    type = 'CREDIT', 
    bookingId?: string, 
    metadata?: any
  ) {
    const operation = `Credit user ${userId} with ${amount}`;
    try {
      // 1. Ensure wallet exists (can be done before the transaction)
      const wallet = await this.ensureWallet(userId);

        // ⚠️ FIX: Use Prisma's atomic 'increment' to prevent race conditions
        const updatedWallet = await prisma.wallet.update({ 
            where: { id: wallet.id }, 
            data: { balance: { increment: amount } } 
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            bookingId,
            type,
            amount,
            balanceAfter: updatedWallet.balance, // Use the post-update balance
            metadata,
          },
        });
        
        this.logger.log(`✅ ${operation} successful. New balance: ${updatedWallet.balance}`);
        return updatedWallet;
      
    } catch (err) {
      this.logger.error(`${operation} failed.`, err);
      throw new InternalServerErrorException('Failed to complete credit transaction');
    }
  }
  
  async creditMechanic(mechanicId: string, amount: number, bookingId?: string) {
    return this.prisma.$transaction(async (tx) => {
      return this.creditWalletWithTx(tx, mechanicId, amount, 'CREDIT', bookingId);
    });
  }

  async creditMechanicWithTx(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, any>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, mechanicId: string, amount: number, bookingId?: string) {
    return this.creditWalletWithTx(prisma, mechanicId, amount, 'CREDIT', bookingId);
  }

  /**
   * Safely debits a user's wallet using atomic operations and checks for sufficiency.
   */
  async debitWalletWithTx(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, any>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, userId: string, amount: number, type = 'DEBIT', bookingId?: string) {
    const operation = `Debit user ${userId} with ${amount}`;
    try {
      // 1. Ensure wallet exists
      const wallet = await this.ensureWallet(userId);

        const currentWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

        if (currentWallet.balance < amount) {
            // ⚠️ FIX: Throw a proper NestJS exception for translation
            throw new BadRequestException('Insufficient balance'); 
        }

        const updatedWallet = await prisma.wallet.update({ 
            where: { id: wallet.id }, 
            data: { balance: { decrement: amount } } // Atomic decrement
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            bookingId,
            type,
            amount,
            balanceAfter: updatedWallet.balance,
          },
        });

      this.logger.log(`✅ ${operation} successful. New balance: ${updatedWallet.balance}`);
      return updatedWallet;

    } catch (err) {
      // ⚠️ FIX: Translate known business error
      if (err instanceof BadRequestException && err.message === 'Insufficient balance') {
          throw new BadRequestException('Wallet debit failed: Insufficient funds.');
      }
      this.logger.error(`${operation} failed.`, err);
      throw new InternalServerErrorException('Failed to debit wallet');
    }
  }

  async debitWallet(userId: string, amount: number, type = 'DEBIT', bookingId?: string) {
    return this.prisma.$transaction(async (tx) => {
      return this.debitWalletWithTx(tx, userId, amount, type, bookingId);
    });
  }

  /**
   * Retrieves a wallet and its transaction history.
   */
  async getWallet(userId:string) {
    return this.prisma.wallet.findUnique({ where: { userId }, include: { WalletTransaction: true }});
  }
}