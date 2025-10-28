import { IPaymentGateway, InitializePaymentData, CreateSubaccountData } from '../interface/payment-gateway.interface';
export declare class FlutterwaveGateway implements IPaymentGateway {
    private readonly logger;
    private readonly baseUrl;
    private readonly secret;
    private readonly currency;
    constructor();
    private headers;
    private handleError;
    initializePayment({ amount, email, metadata }: InitializePaymentData): Promise<{
        paymentUrl: any;
        reference: any;
    } | undefined>;
    verifyPayment(reference: string): Promise<{
        status: "success" | "failed" | "pending";
        amount: number;
        raw: any;
    } | undefined>;
    createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }: CreateSubaccountData): Promise<{
        subaccountId: any;
    } | undefined>;
}
