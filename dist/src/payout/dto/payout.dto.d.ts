import { PayoutStatus } from '@prisma/client';
export declare class RequestPayoutDto {
    amount: string;
    bankAccountNumber: string;
    bankCode: string;
    bankName?: string;
    accountName?: string;
}
export declare class UpdatePayoutStatusDto {
    status: PayoutStatus;
    providerRef?: string;
    failureReason?: string;
    rawGatewayResponse?: any;
}
export declare class ListPayoutsDto {
    mechanicId?: string;
    status?: PayoutStatus;
    page?: number;
    limit?: number;
}
export interface InitiateTransferResult {
    success: boolean;
    message: string;
    providerRef?: string;
    rawGatewayResponse?: any;
}
