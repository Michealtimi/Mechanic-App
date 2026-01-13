import { PrismaService } from 'prisma/prisma.service';
import { IPaymentGateway } from './interface/payment-gateway.interface';
import { ConfigService } from '@nestjs/config';
import { WalletService } from 'src/wallet/wallet.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
interface InitializePaymentDto {
    bookingId: string;
    amount: bigint;
    gateway: string;
    metadata: Record<string, any>;
    mechanicSubaccount?: string | null;
}
export declare class PaymentsService {
    private readonly prisma;
    private readonly gateway;
    private readonly configService;
    private readonly walletService;
    private readonly notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: IPaymentGateway, configService: ConfigService, walletService: WalletService, notificationGateway: NotificationGateway);
    initialize(dto: InitializePaymentDto): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string, gatewayIdentifier?: string): Promise<any>;
    handleWebhook(signature: string, rawBody: Buffer): Promise<void>;
    handleFlutterwaveWebhook(signature: string, rawBody: Buffer): Promise<void>;
    capture(reference: string): Promise<{
        success: boolean;
        gatewayData?: any;
    }>;
    refund(reference: string, amount: bigint): Promise<{
        success: boolean;
        gatewayData?: any;
    }>;
    partialRefund(reference: string, amount: bigint): Promise<{
        success: boolean;
        gatewayData?: any;
    }>;
    initiatePayoutTransfer(mechanicId: string, amount: bigint, bankAccountNumber: string, bankCode: string, payoutId: string): Promise<{
        success: boolean;
        providerRef?: string;
        rawGatewayResponse?: any;
        message?: string;
    }>;
    private triggerPostPaymentActions;
}
export {};
