import { 
  Injectable, 
  InternalServerErrorException, 
  Logger, 
  BadRequestException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Decimal } from 'decimal.js'; // ⬅️ CRITICAL: Import Decimal.js

// Define the TransactionClient type more cleanly
// This will resolve the verbose `Omit<PrismaClient<...>>` type
type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Ensures a wallet exists for a user, creating it if necessary. Idempotent and race-condition resistant.
   * @param userId The ID of the user/mechanic.
   * @param tx An optional transaction client if called within an existing transaction.
   */
  async ensureWallet(userId: string, tx?: TransactionClient) {
    const client = tx || this.prisma;
    let wallet = await client.wallet.findUnique({ where: { userId } });
    if (wallet) return wallet;

    try {
      wallet = await client.wallet.create({ data: { userId, balance: new Decimal(0), pending: new Decimal(0) } }); // ⬅️ Use Decimal(0)
      return wallet;
    } catch (error) {
      // Check if it's a unique constraint violation (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Another request created it just now, so find it and return
        return await client.wallet.findUniqueOrThrow({ where: { userId } });
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Safely credits a user's wallet using atomic database operations.
   * @param tx The Prisma transaction client.
   * @param userId The ID of the user/mechanic to credit.
   * @param amount The amount to credit (as Decimal).
   * @param type The type of transaction (e.g., 'CREDIT', 'BOOKING_PAYMENT').
   * @param bookingId Optional ID of the related booking.
   * @param metadata Optional metadata for the transaction.
   */
  async creditWalletWithTx(
    tx: TransactionClient, // ⬅️ Using the cleaner type alias
    userId: string, 
    amount: Decimal, // ⬅️ CRITICAL: Changed to Decimal
    type: string = 'CREDIT', // ⬅️ Made explicit
    bookingId?: string, 
    metadata?: any
  ): Promise<any> { // ⬅️ Explicit return type
    const operation = `Credit user ${userId} with ${amount.toFixed(2)}`; // ⬅️ Use Decimal.toFixed(2) for logging
    try {
      const wallet = await this.ensureWallet(userId, tx); // Pass tx to ensureWallet

      const updatedWallet = await tx.wallet.update({ 
        where: { id: wallet.id }, 
        data: { balance: { increment: amount } } // ⬅️ Atomic increment with Decimal
      });

      await tx.walletTransaction.create({ // Use tx for transaction client
        data: {
          walletId: wallet.id,
          bookingId,
          type,
          amount, // ⬅️ Store Decimal directly
          balanceAfter: updatedWallet.balance, // Use the post-update balance (Decimal)
          metadata,
        },
      });
      
      this.logger.log(`✅ ${operation} successful. New balance: ${updatedWallet.balance.toFixed(2)}`);
      return updatedWallet;
      
    } catch (err) {
      this.logger.error(`${operation} failed.`, err.stack); // Log stack for better debugging
      throw new InternalServerErrorException('Failed to complete credit transaction', err.message); // Pass original message
    }
  }
  
  // Public method to credit a mechanic, always starting a new transaction
  async creditMechanic(mechanicId: string, amount: Decimal, bookingId?: string, metadata?: any): Promise<any> { // ⬅️ Amount is Decimal
    return this.prisma.$transaction(async (tx) => {
      return this.creditWalletWithTx(tx, mechanicId, amount, 'CREDIT', bookingId, metadata);
    });
  }

  // Your requested change: Renamed from creditMechanicWithTx to `creditMechanicInTransaction` for clarity
  // and made it align with the `creditWalletWithTx` signature.
  async creditMechanicInTransaction(
    tx: TransactionClient, 
    mechanicId: string, 
    amount: Decimal, // ⬅️ Changed to Decimal
    bookingId?: string, 
    metadata?: any
  ): Promise<any> { // ⬅️ Explicit return type
    return this.creditWalletWithTx(tx, mechanicId, amount, 'CREDIT', bookingId, metadata);
  }

  /**
   * Safely debits a user's wallet using atomic operations and checks for sufficiency.
   * @param tx The Prisma transaction client.
   * @param userId The ID of the user/mechanic to debit.
   * @param amount The amount to debit (as Decimal).
   * @param type The type of transaction (e.g., 'DEBIT', 'PAYOUT').
   * @param bookingId Optional ID of the related booking.
   * @param metadata Optional metadata for the transaction.
   */
  async debitWalletWithTx(
    tx: TransactionClient, // ⬅️ Using the cleaner type alias
    userId: string, 
    amount: Decimal, // ⬅️ CRITICAL: Changed to Decimal
    type: string, // ⬅️ Now explicit and required
    bookingId?: string, 
    metadata?: any // ⬅️ Added metadata
  ): Promise<any> { // ⬅️ Explicit return type
    const operation = `Debit user ${userId} with ${amount.toFixed(2)}`;
    try {
      const wallet = await this.ensureWallet(userId, tx);

      const currentWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } }); // Use tx

      if (currentWallet.balance.lessThan(amount)) { // ⬅️ Use Decimal comparison
        throw new BadRequestException('Insufficient balance'); 
      }

      const updatedWallet = await tx.wallet.update({ 
        where: { id: wallet.id }, 
        data: { balance: { decrement: amount } } // ⬅️ Atomic decrement with Decimal
      });

      await tx.walletTransaction.create({ // Use tx
        data: {
          walletId: wallet.id,
          bookingId,
          type,
          amount: amount.neg(), // ⬅️ Store debit as a negative number for easier ledger analysis
          balanceAfter: updatedWallet.balance,
          metadata,
        },
      });

      this.logger.log(`✅ ${operation} successful. New balance: ${updatedWallet.balance.toFixed(2)}`);
      return updatedWallet;

    } catch (err) {
      if (err instanceof BadRequestException && err.message === 'Insufficient balance') {
        throw new BadRequestException('Wallet debit failed: Insufficient funds.');
      }
      this.logger.error(`${operation} failed.`, err.stack);
      throw new InternalServerErrorException('Failed to debit wallet', err.message);
    }
  }

  // Public method to debit a wallet, always starting a new transaction
  async debitWallet(userId: string, amount: Decimal, type: string = 'DEBIT', bookingId?: string, metadata?: any): Promise<any> { // ⬅️ Amount is Decimal
    return this.prisma.$transaction(async (tx) => {
      return this.debitWalletWithTx(tx, userId, amount, type, bookingId, metadata);
    });
  }

  /**
   * Retrieves a wallet and its transaction history.
   */
  async getWallet(userId:string) {
    // You might want to ensure a wallet exists before trying to retrieve it if
    // this method is called frequently and you want to guarantee a wallet always exists.
    return this.prisma.wallet.findUnique({ 
        where: { userId }, 
        include: { WalletTransaction: true }
    });
  }
}