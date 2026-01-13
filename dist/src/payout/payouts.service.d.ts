import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { PaymentsService } from 'src/modules/payment/payments.service';
import { RequestPayoutDto, UpdatePayoutStatusDto, ListPayoutsDto } from './dtos/payout.dtos';
import { Payout } from '@prisma/client';
export declare class PayoutService {
    private readonly prisma;
    private readonly walletService;
    private readonly paymentsService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, paymentsService: PaymentsService);
    requestPayout(mechanicId: string, dto: RequestPayoutDto): Promise<{
        success: boolean;
        message: string;
        data: Payout;
    }>;
    markPayoutResult(payoutId: string, updateDto: UpdatePayoutStatusDto): Promise<Payout>;
    getPayout(payoutId: string): Promise<Payout | null>;
    listPayouts(filters: ListPayoutsDto): Promise<{
        data: Payout[];
        total: number;
        page: number;
        limit: number;
    }>;
}
