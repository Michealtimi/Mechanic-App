import { PrismaService } from 'prisma/prisma.service';
import { ResolveDisputeDto, QueryDisputesDto, QueryWalletsDto, QueryPaymentsDto } from './admin.dto';
import { DisputeService } from 'src/dispute/dispute.service';
import { WalletService } from 'src/wallet/wallet.service';
import { Dispute, Wallet, Payment } from '@prisma/client';
import { PaymentsService } from 'src/paymnet/payments.services';
export declare class AdminService {
    private readonly prisma;
    private readonly disputeService;
    private readonly paymentsService;
    private readonly walletService;
    private readonly logger;
    constructor(prisma: PrismaService, disputeService: DisputeService, paymentsService: PaymentsService, walletService: WalletService);
    resolveDispute(disputeId: string, dto: ResolveDisputeDto): Promise<Dispute>;
    refundPayment(paymentId: string, amount: number): Promise<Payment>;
    listDisputes(query: QueryDisputesDto): Promise<{
        data: Dispute[];
        total: number;
        page: number;
        limit: number;
    }>;
    listWallets(query: QueryWalletsDto): Promise<{
        data: Wallet[];
        total: number;
        page: number;
        limit: number;
    }>;
    getWalletDetail(walletId: string): Promise<Wallet>;
    listPayments(query: QueryPaymentsDto): Promise<{
        data: Payment[];
        total: number;
        page: number;
        limit: number;
    }>;
}
