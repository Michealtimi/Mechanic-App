import { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request } from 'express';
export declare class PaystackWebhookController {
    private readonly paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    handlePaystackWebhook(signature: string, req: RawBodyRequest<Request>): Promise<{
        received: boolean;
        message: string;
    }>;
}
