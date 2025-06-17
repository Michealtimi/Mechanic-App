import { PrismaService } from "prisma/prisma.service";
import { CreateBookingDto } from "./dto/booking.dto";
export declare class BookingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createBooking(dto: CreateBookingDto, serviceId: string, customerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        serviceId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        customerId: string;
        scheduledAt: Date;
    }>;
    getMechanicBooking(id: string): Promise<void>;
}
