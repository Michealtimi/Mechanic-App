export declare class CreateChatRoomDto {
    customerId: string;
    mechanicId: string;
    bookingId?: string;
}
export declare class SendChatMessageDto {
    message: string;
}
export declare class GetChatMessagesDto {
    skip?: number;
    take?: number;
}
export declare class ChatParticipantResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
}
export declare class BookingInChatResponseDto {
    id: string;
    scheduledAt: Date;
    status: string;
}
export declare class ChatMessageResponseDto {
    id: string;
    roomId: string;
    senderId: string;
    sender: ChatParticipantResponseDto;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ChatRoomResponseDto {
    id: string;
    customerId: string;
    mechanicId: string;
    customer: ChatParticipantResponseDto;
    mechanic: ChatParticipantResponseDto;
    bookingId?: string;
    booking?: BookingInChatResponseDto;
    createdAt: Date;
    updatedAt: Date;
    latestMessage?: ChatMessageResponseDto;
}
