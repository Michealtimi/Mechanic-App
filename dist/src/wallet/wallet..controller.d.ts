import { WalletService } from './wallet.service';
declare class DebitWalletDto {
    amount: number;
    type?: string;
    bookingId?: string;
}
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    ensureUserWallet(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
    getMyWallet(req: any): Promise<{
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
    }>;
    creditMechanic(mechanicId: string, amount: number, bookingId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
    debitWallet(req: any, dto: DebitWalletDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
        pending: number;
    }>;
}
export {};
