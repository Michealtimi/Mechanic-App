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
    verifyPayment(reference: string): Promise<import("./interface/payment-gateway.interface").VerifyPaymentResult>;
    handleWebhook(signature: string, rawBody: Buffer): Promise<{
        success: boolean;
    }>;
    capturePayment(bookingId: string): Promise<void>;
    partialRefund(bookingId: string, amount: number): Promise<void>;
}
