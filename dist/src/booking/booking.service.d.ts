import { PrismaService } from "prisma/prisma.service";
import { CreateBookingDto } from "./dto/booking.dto";
export declare class BookingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createBooking(dto: CreateBookingDto, serviceId: string, customerId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        serviceId: string;
        customerId: string;
        scheduledAt: Date;
    }>;
    getMechanicBooking(userId: string): Promise<({
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
