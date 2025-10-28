import { CreateSubaccountData, CreateSubaccountResult, InitializePaymentData, IPaymentGateway, VerifyPaymentResult } from '../interface/payment-gateway.interface';
export declare class PaystackGateway implements IPaymentGateway {
    private readonly logger;
    private readonly baseUrl;
    private readonly secret;
    constructor();
    private handlePaystackError;
    verifyWebhookSignature(signature: string, rawBody: Buffer): boolean;
    initializePayment({ amount, email, metadata }: InitializePaymentData): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<VerifyPaymentResult>;
    createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }: CreateSubaccountData): Promise<CreateSubaccountResult>;
}
