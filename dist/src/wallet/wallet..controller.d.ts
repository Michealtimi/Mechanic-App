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
        balance: import("@prisma/client/runtime/library").Decimal;
        pending: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyWallet(req: any): Promise<{
        WalletTransaction: {
            id: string;
            createdAt: Date;
            type: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            bookingId: string | null;
            balanceAfter: import("@prisma/client/runtime/library").Decimal;
            walletId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        pending: import("@prisma/client/runtime/library").Decimal;
    }>;
    creditMechanic(mechanicId: string, amount: number, bookingId?: string): Promise<any>;
    debitWallet(req: any, dto: DebitWalletDto): Promise<any>;
}
export {};
