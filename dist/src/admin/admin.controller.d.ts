import { ResolveDisputeDto, RefundPaymentDto, QueryDisputesDto, QueryWalletsDto } from './admin.dto';
import { AdminService } from './admin.service.';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
    listDisputes(query: QueryDisputesDto): Promise<{
        data: import(".prisma/client").Dispute[];
        total: number;
        page: number;
        limit: number;
    }>;
    resolveDispute(id: string, body: ResolveDisputeDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        bookingId: string;
        reason: string;
        resolution: string | null;
        resolvedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
    }>;
    listWallets(query: QueryWalletsDto): Promise<{
        data: import(".prisma/client").Wallet[];
        total: number;
        page: number;
        limit: number;
    }>;
    getWalletDetail(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        pending: import("@prisma/client/runtime/library").Decimal;
    }>;
    refundPayment(id: string, body: RefundPaymentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        bookingId: string | null;
        gateway: string;
        reference: string;
        refundedAmount: import("@prisma/client/runtime/library").Decimal;
        rawGatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
        verifiedAt: Date | null;
    }>;
}
