import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../paymnet/payment.services';
import { AuditService } from 'src/audit/audit.service';
import { Dispute } from '@prisma/client';
export declare class DisputeService {
    private readonly prisma;
    private readonly walletService;
    private readonly paymentService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, paymentService: PaymentService, auditService: AuditService);
    raiseDispute(userId: string, bookingId: string, reason: string): Promise<Dispute>;
    resolveDispute(disputeId: string, resolution: string, refundAmount: number, isRefundToCustomer: boolean, isDebitMechanic: boolean): Promise<Dispute>;
    listAll(): Promise<Dispute[]>;
    getDisputeById(disputeId: string): Promise<Dispute | null>;
}
