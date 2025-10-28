import { PaymentService } from './payment.services';
export declare class PaymentController {
    private readonly paymentService;
    private readonly RAW_BODY_KEY;
    constructor(paymentService: PaymentService);
    initiatePayment(): Promise<{
        paymentUrl: string;
        reference: string;
        message: string;
    }>;
    verifyPayment(reference: string): Promise<{
        message: string;
        status: "pending" | "success" | "failed";
        amount: number;
    }>;
    handleWebhook(paystackSignature: string, flutterwaveSignature: string, payload: any): Promise<{
        received: boolean;
    }>;
}
