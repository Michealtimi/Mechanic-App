import { IPaymentGateway, InitializePaymentData, CreateSubaccountData, VerifyPaymentResult, CreateSubaccountResult } from '../interface/payment-gateway.interface';
export declare class FlutterwaveGateway implements IPaymentGateway {
    private readonly logger;
    private readonly baseUrl;
    private readonly secret;
    private readonly currency;
    constructor();
    private headers;
    private handleError;
    initializePayment({ amount, email, metadata }: InitializePaymentData): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<VerifyPaymentResult>;
    createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }: CreateSubaccountData): Promise<CreateSubaccountResult>;
}
