import { PrismaService } from 'prisma/prisma.service';
export declare class PaymentService {
    private prisma;
    private readonly logger;
    private gateway;
    constructor(prisma: PrismaService);
    initiatePaymentForBooking(bookingId: string, amountKobo: number, metadata: any): Promise<{
        payment: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            amount: number;
            reference: string;
            method: string;
            currency: string;
            paidAt: Date | null;
            bookingId: string;
        };
        checkoutUrl: any;
    }>;
    verifyPayment(reference: string): Promise<any>;
    partialRefund(reference: string, amount: number): Promise<any>;
    capturePayment(paymentId: string): Promise<void>;
}
