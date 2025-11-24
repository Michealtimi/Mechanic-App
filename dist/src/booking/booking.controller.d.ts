import { BookingService } from './booking.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<any>;
    getBookings(req: any, filter: BookingFilterDto): Promise<{
        data: any;
        meta: {
            total: any;
            skip: number;
            take: number;
            hasMore: boolean;
        };
    }>;
    getBookingById(id: string, req: any): Promise<any>;
    updateStatus(id: string, dto: UpdateBookingStatusDto, req: any): Promise<any>;
    cancelBooking(id: string, req: any): Promise<any>;
}
