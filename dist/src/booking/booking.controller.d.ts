import { BookingService } from './booking.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<{
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
    getBookings(req: any, filter: BookingFilterDto): Promise<{
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
    getBookingById(id: string, req: any): Promise<{
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
    updateStatus(id: string, dto: UpdateBookingStatusDto, req: any): Promise<{
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
    cancelBooking(id: string, req: any): Promise<{
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
