import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PaymentsService } from 'src/modules/payment/payments.service';
import { ConfigService } from '@nestjs/config';
export declare class PaymentReconcileService implements OnModuleInit {
    private readonly prisma;
    private readonly paymentsService;
    private readonly configService;
    private readonly logger;
    private reconcileBatchSize;
    constructor(prisma: PrismaService, paymentsService: PaymentsService, configService: ConfigService);
    onModuleInit(): void;
    handleReconciliationCron(): Promise<void>;
    reconcileStuckPayments(): Promise<void>;
}
