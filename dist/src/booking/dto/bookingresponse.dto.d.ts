import { BookingStatus } from './creating-booking.dto';
export declare class BookingResponseDto {
    id: string;
    mechanicId: string;
    serviceId: string;
    scheduledAt: Date;
    status: BookingStatus;
    customerId: string;
}
