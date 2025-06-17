export declare class CreateBookingDto {
    mechanicId: string;
    serviceId: string;
    schedudledAt: Date;
    status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}
