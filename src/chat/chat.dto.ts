// src/chat/dto/chat.dto.ts

import { IsString, IsUUID, IsOptional, MinLength, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';

// --- Request DTOs ---

export class CreateChatRoomDto {
  @ApiProperty({ description: 'ID of the customer starting the chat', example: 'uuid-customer-123' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'ID of the mechanic for the chat', example: 'uuid-mechanic-456' })
  @IsUUID()
  mechanicId: string;

  @ApiProperty({
    description: 'Optional: ID of a related unique booking. If provided, the chat room will be specifically linked to this booking.',
    example: 'uuid-booking-789',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;
}

export class SendChatMessageDto {
  @ApiProperty({ description: 'The message content', example: 'Hello, are you available?' })
  @IsString()
  @MinLength(1)
  message: string;

  // Add more fields for future message types if needed
  // @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  // @IsEnum(MessageType)
  // type: MessageType;

  // @ApiProperty({ description: 'Optional: URL of an image attachment', required: false })
  // @IsOptional()
  // @IsUrl()
  // imageUrl?: string;
}

export class GetChatMessagesDto {
  @ApiProperty({ example: 0, required: false, description: 'Number of messages to skip for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiProperty({ example: 50, required: false, description: 'Number of messages to take for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 50;
}

// --- Response DTOs ---

// For nested User objects in chat responses (sender/customer/mechanic)
export class ChatParticipantResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-user-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @Expose()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @Expose()
  @ApiProperty({ example: 'http://example.com/avatar.jpg', required: false })
  @IsOptional()
  profilePictureUrl?: string;
}

export class BookingInChatResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-booking-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: new Date().toISOString(), description: 'Scheduled date/time' })
  @Type(() => Date)
  scheduledAt: Date;

  @Expose()
  @ApiProperty({ example: 'PENDING' }) // Assuming a BookingStatus enum
  status: string; // Or BookingStatus enum if imported
}

export class ChatMessageResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-message-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'uuid-room-id' })
  roomId: string;

  @Expose()
  @ApiProperty({ example: 'uuid-sender-id' })
  senderId: string;

  @Expose()
  @Type(() => ChatParticipantResponseDto)
  @ApiProperty({ type: ChatParticipantResponseDto, description: 'Details of the message sender' })
  sender: ChatParticipantResponseDto; // Now directly includes sender details

  @Expose()
  @ApiProperty({ example: 'Hello, how can I help you?' })
  message: string;

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  @Type(() => Date)
  updatedAt: Date;
}

export class ChatRoomResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-room-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'uuid-customer-id' })
  customerId: string;

  @Expose()
  @ApiProperty({ example: 'uuid-mechanic-id' })
  mechanicId: string;

  @Expose()
  @Type(() => ChatParticipantResponseDto)
  @ApiProperty({ type: ChatParticipantResponseDto, description: 'Details of the customer in the room' })
  customer: ChatParticipantResponseDto;

  @Expose()
  @Type(() => ChatParticipantResponseDto)
  @ApiProperty({ type: ChatParticipantResponseDto, description: 'Details of the mechanic in the room' })
  mechanic: ChatParticipantResponseDto;

  @Expose()
  @ApiProperty({ example: 'uuid-booking-id', required: false })
  @IsOptional()
  bookingId?: string;

  @Expose()
  @Type(() => BookingInChatResponseDto)
  @ApiProperty({ type: BookingInChatResponseDto, required: false, description: 'Details of the linked booking' })
  booking?: BookingInChatResponseDto; // Include booking details

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString() })
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @ApiProperty({ type: ChatMessageResponseDto, description: 'Latest message in the room for preview', required: false })
  @Type(() => ChatMessageResponseDto)
  @IsOptional()
  latestMessage?: ChatMessageResponseDto; // Changed from 'messages' to 'latestMessage'
}