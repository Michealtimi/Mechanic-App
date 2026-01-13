import { BookingService } from './booking.service';
import { CreateBookingDto, UpdateBookingStatusDto, BookingFilterDto, BookingResponseDto } from './dto/booking.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(createBookingDto: CreateBookingDto, req: any): Promise<BookingResponseDto>;
    getAllBookings(req: any, filterDto: BookingFilterDto): Promise<{
        data: BookingResponseDto[];
        meta: {
            total: number;
            skip: number;
            take: number;
            hasMore: boolean;
        };
    }>;
    getBookingById(id: string, req: any): Promise<BookingResponseDto>;
    updateBookingStatus(id: string, updateBookingStatusDto: UpdateBookingStatusDto, req: any): Promise<BookingResponseDto>;
    cancelBooking(id: string, req: any): Promise<BookingResponseDto>;
}
