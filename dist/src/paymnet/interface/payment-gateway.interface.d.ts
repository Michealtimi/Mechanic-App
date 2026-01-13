export interface InitializePaymentData {
    amount: number;
    email: string;
    metadata?: Record<string, any>;
    subaccountCode?: string;
    percentageCharge?: number;
}
export interface VerifyPaymentResult {
    status: 'success' | 'failed' | 'pending' | 'abandoned' | 'cancelled';
    amount: number;
    raw?: any;
}
export interface CreateSubaccountData {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge: number;
}
export interface CreateSubaccountResult {
    subaccountId: string;
    raw?: any;
    [key: string]: any;
}
export interface TransferRequest {
    amount: number;
    bankAccountNumber: string;
    bankCode: string;
    recipientName: string;
    internalReference: string;
    email?: string;
    currency?: string;
    reason?: string;
}
export interface TransferResponse {
    success: boolean;
    providerRef?: string;
    message?: string;
    raw?: any;
}
export interface IPaymentGateway {
    initializePayment(data: InitializePaymentData): Promise<{
        paymentUrl: string;
        reference: string;
        raw?: any;
    }>;
    verifyPayment(reference: string): Promise<VerifyPaymentResult>;
    createSubaccount(data: CreateSubaccountData): Promise<CreateSubaccountResult>;
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
}
