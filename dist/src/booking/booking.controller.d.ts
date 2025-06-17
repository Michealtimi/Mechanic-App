import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/booking.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        serviceId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        customerId: string;
        scheduledAt: Date;
    }>;
    getMechanicBooking(req: any): Promise<void>;
}
