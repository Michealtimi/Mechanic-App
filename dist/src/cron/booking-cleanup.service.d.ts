import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PaymentsService } from 'src/modules/payment/payments.service';
import { ConfigService } from '@nestjs/config';
export declare class BookingCleanupService implements OnModuleInit {
    private readonly prisma;
    private readonly notificationGateway;
    private readonly paymentsService;
    private readonly configService;
    private readonly logger;
    private staleBookingCutoffMs;
    private pendingPaymentCutoffMs;
    constructor(prisma: PrismaService, notificationGateway: NotificationGateway, paymentsService: PaymentsService, configService: ConfigService);
    onModuleInit(): void;
    handleCron(): Promise<void>;
    cancelStaleBookings(): Promise<void>;
    cancelStalePendingPayments(): Promise<void>;
}
