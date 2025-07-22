import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/booking.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        serviceId: string;
        customerId: string;
        scheduledAt: Date;
    }>;
    getMechanicBooking(req: any): Promise<({
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            price: number;
            estimatedTime: string | null;
            availability: string | null;
            mechanicId: string;
        };
        customer: {
            email: string;
            password: string;
            id: string;
            role: import(".prisma/client").$Enums.Role;
            status: string;
            shopName: string | null;
            location: string | null;
            skills: string[];
            createdAt: Date;
            updatedAt: Date;
            experienceYears: number | null;
            profilePictureUrl: string | null;
            bio: string | null;
            certificationUrls: string[];
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        serviceId: string;
        customerId: string;
        scheduledAt: Date;
    })[]>;
}
