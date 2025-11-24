import { WalletService } from './wallet.service';
declare class DebitWalletDto {
    amount: number;
    type?: string;
    bookingId?: string;
}
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    ensureUserWallet(req: any): Promise<any>;
    getMyWallet(req: any): Promise<any>;
    creditMechanic(mechanicId: string, amount: number, bookingId?: string): Promise<any>;
    debitWallet(req: any, dto: DebitWalletDto): Promise<any>;
}
export {};
