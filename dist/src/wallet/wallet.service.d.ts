import { PrismaService } from 'prisma/prisma.service';
export declare class WalletService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ensureWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
    creditWallet(userId: string, amount: number, type?: string, bookingId?: string, metadata?: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
    creditMechanic(mechanicId: string, amount: number, bookingId?: string, metadata?: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
    debitWallet(userId: string, amount: number, type?: string, bookingId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
    getWallet(userId: string): Promise<({
        WalletTransaction: {
            id: string;
            createdAt: Date;
            type: string;
            bookingId: string | null;
            amount: number;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            balanceAfter: number;
            walletId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }) | null>;
}
