import { BookingStatus } from '@prisma/client';
export declare class BookingFilterDto {
    status?: BookingStatus;
    skip?: number;
    take?: number;
}
