import { PrismaService } from 'prisma/prisma.service';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
export declare class BookingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createBooking(dto: CreateBookingDto, customerId: string): Promise<{
        mechanic: {
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
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            price: number;
            mechanicId: string;
            estimatedTime: string | null;
            availability: string | null;
        };
        customer: {
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
    } & {
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date;
        price: number;
        paymentId: string | null;
        paymentStatus: string;
        mechanicId: string;
        serviceId: string;
        customerId: string;
    }>;
    getAllBookings(userId: string, filter: BookingFilterDto): Promise<{
        data: ({
            mechanic: {
                id: string;
                shopName: string | null;
            };
            service: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                title: string;
                price: number;
                mechanicId: string;
                estimatedTime: string | null;
                availability: string | null;
            };
            customer: {
                id: string;
                firstName: string | null;
                lastName: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            scheduledAt: Date;
            price: number;
            paymentId: string | null;
            paymentStatus: string;
            mechanicId: string;
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
        mechanic: {
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
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            price: number;
            mechanicId: string;
            estimatedTime: string | null;
            availability: string | null;
        };
        customer: {
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
    } & {
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date;
        price: number;
        paymentId: string | null;
        paymentStatus: string;
        mechanicId: string;
        serviceId: string;
        customerId: string;
    }>;
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date;
        price: number;
        paymentId: string | null;
        paymentStatus: string;
        mechanicId: string;
        serviceId: string;
        customerId: string;
    }>;
    cancelBooking(id: string, customerId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date;
        price: number;
        paymentId: string | null;
        paymentStatus: string;
        mechanicId: string;
        serviceId: string;
        customerId: string;
    }>;
}
