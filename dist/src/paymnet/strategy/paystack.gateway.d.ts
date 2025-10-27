import { IPaymentGateway } from '../interface/payment-gateway.interface';
export declare class PaystackGateway implements IPaymentGateway {
    private readonly logger;
    private readonly baseUrl;
    private readonly secret;
    constructor();
    private handlePaystackError;
    initializePayment({ amount, email, metadata }: {
        amount: any;
        email: any;
        metadata: any;
    }): Promise<{
        paymentUrl: any;
        reference: any;
    } | undefined>;
    verifyPayment(reference: string): Promise<{
        status: "success" | "failed" | "pending";
        amount: any;
        raw: any;
    } | undefined>;
    createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }: {
        businessName: any;
        bankCode: any;
        accountNumber: any;
        percentageCharge: any;
    }): Promise<{
        subaccountId: any;
    } | undefined>;
}
