export declare class RaiseDisputeDto {
    bookingId: string;
    reason: string;
}
export declare class ResolveDisputeDto {
    resolution: string;
    refundAmount: number;
    isRefundToCustomer: boolean;
    isDebitMechanic: boolean;
}
import { DisputeStatus, Role } from '@prisma/client';
export declare class UserDisputeResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
}
export declare class BookingDisputeResponseDto {
    id: string;
    customerId: string;
    mechanicId: string;
    serviceId: string;
    totalCost: number;
}
export declare class DisputeResponseDto {
    id: string;
    userId: string;
    bookingId: string;
    reason: string;
    resolution?: string;
    status: DisputeStatus;
    resolvedAmount?: number;
    createdAt: Date;
    updatedAt: Date;
    user?: UserDisputeResponseDto;
    booking?: BookingDisputeResponseDto;
}
