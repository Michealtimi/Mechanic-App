import { PrismaService } from 'prisma/prisma.service';
export declare class WalletService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ensureWallet(userId: string): Promise<any>;
    creditMechanic(mechanicId: string, amount: number, bookingId?: string, metadata?: any): Promise<any>;
    debitWallet(userId: string, amount: number, type?: string, bookingId?: string): Promise<any>;
    getWallet(userId: string): Promise<any>;
}
