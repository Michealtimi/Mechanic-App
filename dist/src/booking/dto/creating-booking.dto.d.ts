export declare enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class CreateBookingDto {
    mechanicId: string;
    serviceId: string;
    scheduledAt: Date;
    status?: BookingStatus;
}
