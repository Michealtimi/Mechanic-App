import { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request } from 'express';
export declare class FlutterwaveWebhookController {
    private readonly paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    handleFlutterwaveWebhook(signature: string, req: RawBodyRequest<Request>): Promise<{
        received: boolean;
        message: string;
    }>;
}
