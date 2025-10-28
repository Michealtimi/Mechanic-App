import { PrismaService } from 'prisma/prisma.service';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
import { PaymentService } from '../paymnet/payment.services';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { WalletService } from 'src/wallet/wallet.service';
export declare class BookingService {
    private readonly prisma;
    private readonly paymentService;
    private readonly walletService;
    private readonly notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, paymentService: PaymentService, walletService: WalletService, notificationGateway: NotificationGateway);
    createBooking(dto: CreateBookingDto, customerId: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.Status;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            shopName: string | null;
            location: string | null;
            experienceYears: number | null;
            profilePictureUrl: string | null;
            bio: string | null;
            certificationUrls: string[];
            deletedAt: Date | null;
            lastLogin: Date | null;
        };
        mechanic: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.Status;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            shopName: string | null;
            location: string | null;
            experienceYears: number | null;
            profilePictureUrl: string | null;
            bio: string | null;
            certificationUrls: string[];
            deletedAt: Date | null;
            lastLogin: Date | null;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            mechanicId: string;
            title: string;
            description: string | null;
            estimatedTime: string | null;
            availability: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        scheduledAt: Date;
        price: number;
        paymentStatus: string;
        customerId: string;
        mechanicId: string;
        serviceId: string;
        paymentId: string | null;
    }>;
    getAllBookings(userId: string, filter: BookingFilterDto): Promise<{
        data: ({
            customer: {
                id: string;
                firstName: string | null;
                lastName: string | null;
            };
            mechanic: {
                id: string;
                shopName: string | null;
            };
            service: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                mechanicId: string;
                title: string;
                description: string | null;
                estimatedTime: string | null;
                availability: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BookingStatus;
            scheduledAt: Date;
            price: number;
            paymentStatus: string;
            customerId: string;
            mechanicId: string;
            serviceId: string;
            paymentId: string | null;
        })[];
        meta: {
            total: number;
            skip: number;
            take: number;
            hasMore: boolean;
        };
    }>;
    getBookingById(id: string, userId: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.Status;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            shopName: string | null;
            location: string | null;
            experienceYears: number | null;
            profilePictureUrl: string | null;
            bio: string | null;
            certificationUrls: string[];
            deletedAt: Date | null;
            lastLogin: Date | null;
        };
        mechanic: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.Status;
            email: string;
            password: string;
            firstName: string | null;
            lastName: string | null;
            role: import(".prisma/client").$Enums.Role;
            shopName: string | null;
            location: string | null;
            experienceYears: number | null;
            profilePictureUrl: string | null;
            bio: string | null;
            certificationUrls: string[];
            deletedAt: Date | null;
            lastLogin: Date | null;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            mechanicId: string;
            title: string;
            description: string | null;
            estimatedTime: string | null;
            availability: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        scheduledAt: Date;
        price: number;
        paymentStatus: string;
        customerId: string;
        mechanicId: string;
        serviceId: string;
        paymentId: string | null;
    }>;
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        scheduledAt: Date;
        price: number;
        paymentStatus: string;
        customerId: string;
        mechanicId: string;
        serviceId: string;
        paymentId: string | null;
    }>;
    cancelBooking(id: string, customerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        scheduledAt: Date;
        price: number;
        paymentStatus: string;
        customerId: string;
        mechanicId: string;
        serviceId: string;
        paymentId: string | null;
    }>;
}
