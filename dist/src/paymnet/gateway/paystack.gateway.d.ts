export declare class PaystackGateway implements PaymentGateway {
    private secretKey;
    private baseUrl;
    constructor(secretKey: string, baseUrl: string);
    createCharge(amount: number, currency: string, metadata: any): Promise<{
        reference: any;
        checkoutUrl: any;
    }>;
    verifyPayment(reference: string): Promise<{
        success: boolean;
        reference: any;
        amount: any;
        gatewayResponse: any;
    }>;
    initiatePayout(beneficiaryDetails: any, amount: number): Promise<{
        success: boolean;
    }>;
}
