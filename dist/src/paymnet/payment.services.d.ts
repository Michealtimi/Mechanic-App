import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto/createPayment.dto';
export declare class PaymentService {
    private readonly prisma;
    private PAYSTACK_SECRET;
    constructor(prisma: PrismaService);
    initiatePayment(dto: CreatePaymentDto, customerEmail: string): Promise<PaymentResponseDto>;
    verifyPayment(reference: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            amount: number;
            reference: string;
            method: string;
        };
    }>;
}
