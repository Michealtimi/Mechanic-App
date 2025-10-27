import { PaymentService } from './payment.services';
export declare class PaymentWebhookController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    handleWebhook(req: any, res: any): Promise<any>;
}
