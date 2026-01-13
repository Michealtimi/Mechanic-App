import { BookingStatus, PaymentStatus } from '@prisma/client';
export declare class CreateBookingDto {
    mechanicId?: string;
    serviceId: string;
    scheduledAt: Date;
    status?: BookingStatus;
    pickupLatitude: string;
    pickupLongitude: string;
    pickupAddress: string;
    pickupLocationNotes?: string;
}
export declare class UpdateBookingStatusDto {
    status: BookingStatus;
}
export declare class BookingFilterDto {
    status?: BookingStatus;
    skip?: number;
    take?: number;
}
export declare class UserInBookingResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
}
export declare class MechanicInBookingResponseDto extends UserInBookingResponseDto {
    shopName: string;
    averageRating: number;
    totalReviews: number;
    isEvSpecialist: boolean;
}
export declare class ServiceInBookingResponseDto {
    id: string;
    title: string;
    description: string;
    price: string;
}
export declare class ChatRoomInBookingResponseDto {
    id: string;
}
export declare class PaymentInBookingResponseDto {
    id: string;
    status: PaymentStatus;
    amount: string;
    reference: string;
}
export declare class DisputeInBookingResponseDto {
    id: string;
    reason: string;
    status: string;
    createdAt: Date;
}
export declare class BookingResponseDto {
    id: string;
    customerId: string;
    mechanicId: string;
    customer: UserInBookingResponseDto;
    mechanic: MechanicInBookingResponseDto;
    service: ServiceInBookingResponseDto;
    scheduledAt: Date;
    price: string;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
    chatRoom?: ChatRoomInBookingResponseDto;
    payment?: PaymentInBookingResponseDto;
    disputes?: DisputeInBookingResponseDto[];
}
