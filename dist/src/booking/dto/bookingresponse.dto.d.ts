export declare class bookingResponseDto {
    mechanicId: string;
    serviceId: string;
    schedudledAt: Date;
    status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}
