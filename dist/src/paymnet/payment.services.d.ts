import { PrismaService } from 'prisma/prisma.service';
import { IPaymentGateway } from './interface/payment-gateway.interface';
export declare class PaymentService {
    private readonly prisma;
    private readonly gateway;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: IPaymentGateway);
    initializePayment(bookingId: string, userId: string): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string, overrideGateway?: IPaymentGateway): Promise<any>;
    handleWebhook(signature: string, rawBody: Buffer, gatewayIdentifier?: string): Promise<{
        success: boolean;
    }>;
    capturePayment(reference: string): Promise<{
        success: boolean;
        gatewayData?: any;
    }>;
    refundPayment(reference: string, amount: number): Promise<{
        success: boolean;
        gatewayData?: any;
    }>;
    partialRefund(reference: string, amount: number): Promise<{
        success: boolean;
        gatewayData?: any;
    }>;
    private triggerPostPaymentActions;
    private getGatewayName;
}
