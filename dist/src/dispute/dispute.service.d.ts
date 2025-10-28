import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../paymnet/payment.services';
export declare class DisputeService {
    private readonly prisma;
    private readonly walletService;
    private readonly paymentService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, paymentService: PaymentService);
    raiseDispute(userId: string, bookingId: string, reason: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        reason: string;
        resolution: string | null;
        bookingId: string;
    }>;
    resolveDispute(disputeId: string, resolution: string, refundAmount: number, isRefundToCustomer: boolean, isDebitMechanic: boolean): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        reason: string;
        resolution: string | null;
        bookingId: string;
    }>;
    listAll(): Promise<({
        user: {
            id: string;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            status: import(".prisma/client").$Enums.Status;
            shopName: string | null;
            location: string | null;
            createdAt: Date;
            updatedAt: Date;
            experienceYears: number | null;
            profilePictureUrl: string | null;
            bio: string | null;
            certificationUrls: string[];
            deletedAt: Date | null;
            lastLogin: Date | null;
        };
        booking: {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date;
            price: number;
            paymentStatus: string;
            mechanicId: string;
            serviceId: string;
            paymentId: string | null;
            customerId: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        reason: string;
        resolution: string | null;
        bookingId: string;
    })[]>;
}
