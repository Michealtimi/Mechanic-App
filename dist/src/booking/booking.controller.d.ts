import { BookingService } from './booking.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { BookingResponseDto } from './dto/bookingresponse.dto';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto;
    }>;
    getBookings(req: any): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto[];
    }>;
    getBookingById(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto;
    }>;
    updateStatus(id: string, dto: UpdateBookingStatusDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto;
    }>;
    cancelBooking(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
