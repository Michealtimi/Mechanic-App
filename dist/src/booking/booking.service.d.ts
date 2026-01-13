import { PrismaService } from 'prisma/prisma.service';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingFilterDto } from './dto/booking.dto';
import { PaymentsService } from '../payments/payments.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { WalletService } from 'src/wallet/wallet.service';
import { AuditService } from 'src/audit/audit.service';
import { UsersService } from '../users/users.service';
import { ChatService } from '../chat/chat.service';
export declare class BookingService {
    private readonly prisma;
    private readonly paymentService;
    private readonly walletService;
    private readonly auditService;
    private readonly notificationGateway;
    private readonly usersService;
    private readonly chatService;
    private readonly logger;
    constructor(prisma: PrismaService, paymentService: PaymentsService, walletService: WalletService, auditService: AuditService, notificationGateway: NotificationGateway, usersService: UsersService, chatService: ChatService);
    createBooking(dto: CreateBookingDto, customerId: string): Promise<{
        booking: any;
        payment: any;
    }>;
    getAllBookings(userId: string, filter: BookingFilterDto): Promise<{
        data: ({
            chatRoom: {
                id: string;
            } | null;
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                amount: import("@prisma/client/runtime/library").Decimal;
                reference: string;
            } | null;
            mechanic: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
                phoneNumber: string | null;
                shopName: string | null;
                isEvSpecialist: boolean;
                averageRating: number;
                totalReviews: number;
            } | null;
            service: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                title: string;
                mechanicId: string;
                price: number;
                estimatedTime: string | null;
                availability: string | null;
            };
            customer: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
                phoneNumber: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            mechanicId: string | null;
            scheduledAt: Date;
            price: import("@prisma/client/runtime/library").Decimal;
            pickupLatitude: import("@prisma/client/runtime/library").Decimal;
            pickupLongitude: import("@prisma/client/runtime/library").Decimal;
            pickupAddress: string;
            pickupLocationNotes: string | null;
            serviceId: string;
            customerId: string;
        })[];
        meta: {
            total: number;
            skip: number;
            take: number;
            hasMore: boolean;
        };
    }>;
    getBookingById(id: string, userId: string): Promise<{
        chatRoom: {
            id: string;
        } | null;
        payment: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            reference: string;
        } | null;
        disputes: {
            id: string;
            status: import(".prisma/client").$Enums.DisputeStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            bookingId: string;
            reason: string;
            resolution: string | null;
            resolvedAmount: import("@prisma/client/runtime/library").Decimal | null;
            resolvedAt: Date | null;
        }[];
        mechanic: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            phoneNumber: string | null;
            shopName: string | null;
            isEvSpecialist: boolean;
            averageRating: number;
            totalReviews: number;
        } | null;
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            mechanicId: string;
            price: number;
            estimatedTime: string | null;
            availability: string | null;
        };
        customer: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            phoneNumber: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string | null;
        scheduledAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        pickupLatitude: import("@prisma/client/runtime/library").Decimal;
        pickupLongitude: import("@prisma/client/runtime/library").Decimal;
        pickupAddress: string;
        pickupLocationNotes: string | null;
        serviceId: string;
        customerId: string;
    }>;
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string): Promise<any>;
    cancelBooking(id: string, customerId: string): Promise<any>;
}
