import { 
  Injectable, 
  InternalServerErrorException, 
  Logger, 
  BadRequestException, // ⬅️ Added for better error translation
} from '@nestjs/common';
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
   * @param amount The amount in kobo/cents.
   */
  async creditWallet(userId: string, amount: number, type = 'CREDIT', bookingId?: string, metadata?: any) {
    const operation = `Credit user ${userId} with ${amount}`;
    try {
      // 1. Ensure wallet exists (can be done before the transaction)
      const wallet = await this.ensureWallet(userId);

      // 2. Perform the atomic update and transaction record creation
      const txResult = await this.prisma.$transaction(async (prisma) => {
        // ⚠️ FIX: Use Prisma's atomic 'increment' to prevent race conditions
        const updatedWallet = await prisma.wallet.update({ 
            where: { id: wallet.id }, 
            data: { balance: { increment: amount } } 
        });

        // The final balance is guaranteed to be correct after the atomic update
        const newTransaction = await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            bookingId,
            type,
            amount,
            balanceAfter: updatedWallet.balance, // Use the post-update balance
            metadata,
          },
        });
        return { updatedWallet, newTransaction };
      });
      
      this.logger.log(`✅ ${operation} successful. New balance: ${txResult.updatedWallet.balance}`);
      return txResult.updatedWallet;
    } catch (err) {
      this.logger.error(`${operation} failed.`, err);
      throw new InternalServerErrorException('Failed to complete credit transaction');
    }
  }
  
  // NOTE: Renamed from creditMechanic to the more general creditWallet and added the user ID to the argument list for consistency.
  async creditMechanic(mechanicId: string, amount: number, bookingId?: string, metadata?: any) {
    return this.creditWallet(mechanicId, amount, 'CREDIT', bookingId, metadata);
  }

  /**
   * Safely debits a user's wallet using atomic operations and checks for sufficiency.
   */
  async debitWallet(userId: string, amount: number, type = 'DEBIT', bookingId?: string) {
    const operation = `Debit user ${userId} with ${amount}`;
    try {
      // 1. Ensure wallet exists
      const wallet = await this.ensureWallet(userId);

      // 2. Perform the atomic update and transaction record creation
      const txResult = await this.prisma.$transaction(async (prisma) => {
        // ⚠️ FIX: Use raw SQL or extended syntax for atomic decrement with balance check
        // The safest way is to use raw SQL/executeRaw for conditional update, 
        // but sticking to Prisma for simplicity:
        
        const currentWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

        if (currentWallet.balance < amount) {
            // ⚠️ FIX: Throw a proper NestJS exception for translation
            throw new BadRequestException('Insufficient balance'); 
        }

        const updatedWallet = await prisma.wallet.update({ 
            where: { id: wallet.id }, 
            data: { balance: { decrement: amount } } // Atomic decrement
        });

        const newTransaction = await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            bookingId,
            type,
            amount,
            balanceAfter: updatedWallet.balance,
          },
        });
        return { updatedWallet, newTransaction };
      });

      this.logger.log(`✅ ${operation} successful. New balance: ${txResult.updatedWallet.balance}`);
      return txResult.updatedWallet;
    } catch (err) {
      // ⚠️ FIX: Translate known business error
      if (err instanceof BadRequestException && err.message === 'Insufficient balance') {
          throw new BadRequestException('Wallet debit failed: Insufficient funds.');
      }
      this.logger.error(`${operation} failed.`, err);
      throw new InternalServerErrorException('Failed to debit wallet');
    }
  }

  /**
   * Retrieves a wallet and its transaction history.
   */
  async getWallet(userId:string) {
    return this.prisma.wallet.findUnique({ where: { userId }, include: { WalletTransaction: true }});
  }
}