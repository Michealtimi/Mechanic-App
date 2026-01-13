"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoomResponseDto = exports.ChatMessageResponseDto = exports.BookingInChatResponseDto = exports.ChatParticipantResponseDto = exports.GetChatMessagesDto = exports.SendChatMessageDto = exports.CreateChatRoomDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateChatRoomDto {
    customerId;
    mechanicId;
    bookingId;
}
exports.CreateChatRoomDto = CreateChatRoomDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the customer starting the chat', example: 'uuid-customer-123' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the mechanic for the chat', example: 'uuid-mechanic-456' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional: ID of a related unique booking. If provided, the chat room will be specifically linked to this booking.',
        example: 'uuid-booking-789',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChatRoomDto.prototype, "bookingId", void 0);
class SendChatMessageDto {
    message;
}
exports.SendChatMessageDto = SendChatMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The message content', example: 'Hello, are you available?' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SendChatMessageDto.prototype, "message", void 0);
class GetChatMessagesDto {
    skip = 0;
    take = 50;
}
exports.GetChatMessagesDto = GetChatMessagesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, required: false, description: 'Number of messages to skip for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GetChatMessagesDto.prototype, "skip", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, required: false, description: 'Number of messages to take for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetChatMessagesDto.prototype, "take", void 0);
class ChatParticipantResponseDto {
    id;
    firstName;
    lastName;
    profilePictureUrl;
}
exports.ChatParticipantResponseDto = ChatParticipantResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-user-id' }),
    __metadata("design:type", String)
], ChatParticipantResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], ChatParticipantResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], ChatParticipantResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'http://example.com/avatar.jpg', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatParticipantResponseDto.prototype, "profilePictureUrl", void 0);
class BookingInChatResponseDto {
    id;
    scheduledAt;
    status;
}
exports.BookingInChatResponseDto = BookingInChatResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-booking-id' }),
    __metadata("design:type", String)
], BookingInChatResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Scheduled date/time' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], BookingInChatResponseDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'PENDING' }),
    __metadata("design:type", String)
], BookingInChatResponseDto.prototype, "status", void 0);
class ChatMessageResponseDto {
    id;
    roomId;
    senderId;
    sender;
    message;
    createdAt;
    updatedAt;
}
exports.ChatMessageResponseDto = ChatMessageResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-message-id' }),
    __metadata("design:type", String)
], ChatMessageResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-room-id' }),
    __metadata("design:type", String)
], ChatMessageResponseDto.prototype, "roomId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-sender-id' }),
    __metadata("design:type", String)
], ChatMessageResponseDto.prototype, "senderId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => ChatParticipantResponseDto),
    (0, swagger_1.ApiProperty)({ type: ChatParticipantResponseDto, description: 'Details of the message sender' }),
    __metadata("design:type", ChatParticipantResponseDto)
], ChatMessageResponseDto.prototype, "sender", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Hello, how can I help you?' }),
    __metadata("design:type", String)
], ChatMessageResponseDto.prototype, "message", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ChatMessageResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ChatMessageResponseDto.prototype, "updatedAt", void 0);
class ChatRoomResponseDto {
    id;
    customerId;
    mechanicId;
    customer;
    mechanic;
    bookingId;
    booking;
    createdAt;
    updatedAt;
    latestMessage;
}
exports.ChatRoomResponseDto = ChatRoomResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-room-id' }),
    __metadata("design:type", String)
], ChatRoomResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-customer-id' }),
    __metadata("design:type", String)
], ChatRoomResponseDto.prototype, "customerId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-mechanic-id' }),
    __metadata("design:type", String)
], ChatRoomResponseDto.prototype, "mechanicId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => ChatParticipantResponseDto),
    (0, swagger_1.ApiProperty)({ type: ChatParticipantResponseDto, description: 'Details of the customer in the room' }),
    __metadata("design:type", ChatParticipantResponseDto)
], ChatRoomResponseDto.prototype, "customer", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => ChatParticipantResponseDto),
    (0, swagger_1.ApiProperty)({ type: ChatParticipantResponseDto, description: 'Details of the mechanic in the room' }),
    __metadata("design:type", ChatParticipantResponseDto)
], ChatRoomResponseDto.prototype, "mechanic", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-booking-id', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChatRoomResponseDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => BookingInChatResponseDto),
    (0, swagger_1.ApiProperty)({ type: BookingInChatResponseDto, required: false, description: 'Details of the linked booking' }),
    __metadata("design:type", BookingInChatResponseDto)
], ChatRoomResponseDto.prototype, "booking", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ChatRoomResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ChatRoomResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ type: ChatMessageResponseDto, description: 'Latest message in the room for preview', required: false }),
    (0, class_transformer_1.Type)(() => ChatMessageResponseDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ChatMessageResponseDto)
], ChatRoomResponseDto.prototype, "latestMessage", void 0);
//# sourceMappingURL=chat.dto.js.map