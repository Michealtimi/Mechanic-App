import { BookingService } from './booking.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateBookingDto } from './dto/creating-booking.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<{
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
    getBookings(req: any): Promise<{
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
    getBookingById(id: string, req: any): Promise<{
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
    updateStatus(id: string, dto: UpdateBookingStatusDto, req: any): Promise<{
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
    cancelBooking(id: string, req: any): Promise<{
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
