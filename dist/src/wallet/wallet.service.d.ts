import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
export declare class WalletService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    ensureWallet(userId: string): Promise<any>;
    creditWalletWithTx(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, any>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, userId: string, amount: number, type?: string, bookingId?: string, metadata?: any): Promise<any>;
    creditMechanic(mechanicId: string, amount: number, bookingId?: string): Promise<any>;
    creditMechanicWithTx(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, any>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, mechanicId: string, amount: number, bookingId?: string): Promise<any>;
    debitWalletWithTx(prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, any>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, userId: string, amount: number, type?: string, bookingId?: string): Promise<any>;
    debitWallet(userId: string, amount: number, type?: string, bookingId?: string): Promise<any>;
    getWallet(userId: string): Promise<any>;
}
