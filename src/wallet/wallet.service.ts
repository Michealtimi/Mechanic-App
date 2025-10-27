import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async ensureWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId }});
    if (existing) return existing;
    return this.prisma.wallet.create({ data: { userId, balance: 0, pending: 0 }});
  }

  async creditMechanic(mechanicId: string, amount: number, bookingId?: string, metadata?: any) {
    // amount in kobo
    try {
      const wallet = await this.ensureWallet(mechanicId);

      // increase balance
      const newBalance = wallet.balance + amount;

      const tx = await this.prisma.$transaction([
        this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
        this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            bookingId,
            type: 'CREDIT',
            amount,
            balanceAfter: newBalance,
            metadata,
          },
        }),
      ]);

      return tx[0]; // updated wallet
    } catch (err) {
      this.logger.error('creditMechanic error', err);
      throw new InternalServerErrorException('Failed to credit mechanic');
    }
  }

  async debitWallet(userId: string, amount: number, type = 'DEBIT', bookingId?: string) {
    try {
      const wallet = await this.ensureWallet(userId);
      if (wallet.balance < amount) throw new Error('Insufficient balance');
      const newBalance = wallet.balance - amount;

      const tx = await this.prisma.$transaction([
        this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
        this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            bookingId,
            type,
            amount,
            balanceAfter: newBalance,
          },
        }),
      ]);
      return tx[0];
    } catch (err) {
      this.logger.error('debitWallet error', err);
      throw new InternalServerErrorException('Failed to debit wallet');
    }
  }

  async getWallet(userId:string) {
    return this.prisma.wallet.findUnique({ where: { userId }, include: { WalletTransaction: true }});
  }
}
