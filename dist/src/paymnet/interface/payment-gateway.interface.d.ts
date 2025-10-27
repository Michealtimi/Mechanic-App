export interface InitializePaymentData {
    amount: number;
    email: string;
    metadata?: Record<string, any>;
}
export interface VerifyPaymentResult {
    status: 'success' | 'failed' | 'pending';
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
    [key: string]: any;
}
export interface IPaymentGateway {
    initializePayment(data: InitializePaymentData): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<VerifyPaymentResult>;
    createSubaccount(data: CreateSubaccountData): Promise<CreateSubaccountResult>;
}
