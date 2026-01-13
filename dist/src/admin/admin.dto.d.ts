import { DisputeStatus, PaymentStatus } from '@prisma/client';
export declare class ResolveDisputeDto {
    resolution: string;
    refundToCustomer: boolean;
    refundAmount: number;
    debitMechanic: boolean;
}
export declare class RefundPaymentDto {
    amount: number;
}
export declare class QueryDisputesDto {
    status?: DisputeStatus;
    customerId?: string;
    mechanicId?: string;
    page?: number;
    limit?: number;
}
export declare class QueryWalletsDto {
    userId?: string;
    page?: number;
    limit?: number;
}
export declare class QueryPaymentsDto {
    userId?: string;
    status?: PaymentStatus;
    page?: number;
    limit?: number;
}
