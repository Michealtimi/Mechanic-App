import { PaymentService } from './payment.services';
export declare class FlutterwaveWebhookController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    handlePaystackWebhook(signature: string, req: {
        rawBody: Buffer;
        body: any;
    }): Promise<{
        received: boolean;
    }>;
}
