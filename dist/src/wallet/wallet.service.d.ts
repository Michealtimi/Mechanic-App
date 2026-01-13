import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Decimal } from 'decimal.js';
type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
export declare class WalletService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ensureWallet(userId: string, tx?: TransactionClient): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: Prisma.Decimal;
        pending: Prisma.Decimal;
    }>;
    creditWalletWithTx(tx: TransactionClient, userId: string, amount: Decimal, type?: string, bookingId?: string, metadata?: any): Promise<any>;
    creditMechanic(mechanicId: string, amount: Decimal, bookingId?: string, metadata?: any): Promise<any>;
    creditMechanicInTransaction(tx: TransactionClient, mechanicId: string, amount: Decimal, bookingId?: string, metadata?: any): Promise<any>;
    debitWalletWithTx(tx: TransactionClient, userId: string, amount: Decimal, type: string, bookingId?: string, metadata?: any): Promise<any>;
    debitWallet(userId: string, amount: Decimal, type?: string, bookingId?: string, metadata?: any): Promise<any>;
    getWallet(userId: string): Promise<({
        WalletTransaction: {
            id: string;
            createdAt: Date;
            type: string;
            metadata: Prisma.JsonValue | null;
            amount: Prisma.Decimal;
            bookingId: string | null;
            balanceAfter: Prisma.Decimal;
            walletId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: Prisma.Decimal;
        pending: Prisma.Decimal;
    }) | null>;
}
export {};
