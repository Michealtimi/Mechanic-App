import { PrismaService } from 'prisma/prisma.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { BookingResponseDto } from './dto/bookingresponse.dto';
export declare class BookingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createBooking(dto: CreateBookingDto, customerId: string): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto;
    }>;
    getAllBookings(userId: string): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto[];
    }>;
    getBookingById(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto;
    }>;
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string): Promise<{
        success: boolean;
        message: string;
        data: BookingResponseDto;
    }>;
    cancelBooking(id: string, customerId: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
