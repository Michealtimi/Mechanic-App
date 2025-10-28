import { Request, Response } from 'express';
import { PaymentService } from './payment.services';
export declare class PaystackWebhookController {
    private readonly paymentService;
    private readonly logger;
    constructor(paymentService: PaymentService);
    handlePaystackEvent(req: Request, res: Response): Promise<void>;
}
