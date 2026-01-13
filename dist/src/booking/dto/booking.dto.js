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
exports.BookingResponseDto = exports.DisputeInBookingResponseDto = exports.PaymentInBookingResponseDto = exports.ChatRoomInBookingResponseDto = exports.ServiceInBookingResponseDto = exports.MechanicInBookingResponseDto = exports.UserInBookingResponseDto = exports.BookingFilterDto = exports.UpdateBookingStatusDto = exports.CreateBookingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateBookingDto {
    mechanicId;
    serviceId;
    scheduledAt;
    status = client_1.BookingStatus.PENDING;
    pickupLatitude;
    pickupLongitude;
    pickupAddress;
    pickupLocationNotes;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-mechanic', description: 'ID of the mechanic to book', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-service', description: 'ID of the service being booked' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: new Date().toISOString(),
        description: 'Scheduled date and time of the service (ISO 8601 format)',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateBookingDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: client_1.BookingStatus.PENDING,
        enum: client_1.BookingStatus,
        required: false,
        description: 'Initial status of the booking (defaults to PENDING)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.BookingStatus),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '34.0522',
        description: 'Latitude of the customer\'s pickup location. Must be a decimal string.',
        type: String,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickupLatitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '-118.2437',
        description: 'Longitude of the customer\'s pickup location. Must be a decimal string.',
        type: String,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickupLongitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '123 Main St, Anytown, USA',
        description: 'Human-readable address of the customer\'s pickup location.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickupAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Behind the red building with a large sign.',
        required: false,
        description: 'Optional additional notes for the mechanic regarding the pickup location.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickupLocationNotes", void 0);
class UpdateBookingStatusDto {
    status;
}
exports.UpdateBookingStatusDto = UpdateBookingStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: client_1.BookingStatus.CONFIRMED, enum: client_1.BookingStatus, description: 'New status for the booking' }),
    (0, class_validator_1.IsEnum)(client_1.BookingStatus),
    __metadata("design:type", String)
], UpdateBookingStatusDto.prototype, "status", void 0);
class BookingFilterDto {
    status;
    skip = 0;
    take = 10;
}
exports.BookingFilterDto = BookingFilterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: client_1.BookingStatus.PENDING, enum: client_1.BookingStatus, required: false, description: 'Filter bookings by status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.BookingStatus),
    __metadata("design:type", String)
], BookingFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, required: false, description: 'Number of items to skip for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], BookingFilterDto.prototype, "skip", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, required: false, description: 'Number of items to take for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], BookingFilterDto.prototype, "take", void 0);
class UserInBookingResponseDto {
    id;
    firstName;
    lastName;
    email;
    phoneNumber;
}
exports.UserInBookingResponseDto = UserInBookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-user-id' }),
    __metadata("design:type", String)
], UserInBookingResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], UserInBookingResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], UserInBookingResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'john.doe@example.com' }),
    __metadata("design:type", String)
], UserInBookingResponseDto.prototype, "email", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: '+1234567890', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserInBookingResponseDto.prototype, "phoneNumber", void 0);
class MechanicInBookingResponseDto extends UserInBookingResponseDto {
    shopName;
    averageRating;
    totalReviews;
    isEvSpecialist;
}
exports.MechanicInBookingResponseDto = MechanicInBookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'AutoFix Pro' }),
    __metadata("design:type", String)
], MechanicInBookingResponseDto.prototype, "shopName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 4.5, description: 'Average rating of the mechanic' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MechanicInBookingResponseDto.prototype, "averageRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 120, description: 'Total number of reviews for the mechanic' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], MechanicInBookingResponseDto.prototype, "totalReviews", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'Indicates if the mechanic specializes in EV' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MechanicInBookingResponseDto.prototype, "isEvSpecialist", void 0);
class ServiceInBookingResponseDto {
    id;
    title;
    description;
    price;
}
exports.ServiceInBookingResponseDto = ServiceInBookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-service-id' }),
    __metadata("design:type", String)
], ServiceInBookingResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Oil Change' }),
    __metadata("design:type", String)
], ServiceInBookingResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Full synthetic oil change and filter replacement.' }),
    __metadata("design:type", String)
], ServiceInBookingResponseDto.prototype, "description", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: '50.00', description: 'Price of the service (as string for Decimal)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServiceInBookingResponseDto.prototype, "price", void 0);
class ChatRoomInBookingResponseDto {
    id;
}
exports.ChatRoomInBookingResponseDto = ChatRoomInBookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-chatroom-id' }),
    __metadata("design:type", String)
], ChatRoomInBookingResponseDto.prototype, "id", void 0);
class PaymentInBookingResponseDto {
    id;
    status;
    amount;
    reference;
}
exports.PaymentInBookingResponseDto = PaymentInBookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-payment-id' }),
    __metadata("design:type", String)
], PaymentInBookingResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: client_1.PaymentStatus, example: client_1.PaymentStatus.AUTHORIZED }),
    __metadata("design:type", String)
], PaymentInBookingResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: '100.00', description: 'Amount of the payment (as string for Decimal)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentInBookingResponseDto.prototype, "amount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'ps_ref_xyz123', description: 'Payment gateway reference' }),
    __metadata("design:type", String)
], PaymentInBookingResponseDto.prototype, "reference", void 0);
class DisputeInBookingResponseDto {
    id;
    reason;
    status;
    createdAt;
}
exports.DisputeInBookingResponseDto = DisputeInBookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-dispute-id' }),
    __metadata("design:type", String)
], DisputeInBookingResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Mechanic did not complete the job.' }),
    __metadata("design:type", String)
], DisputeInBookingResponseDto.prototype, "reason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'OPEN' }),
    __metadata("design:type", String)
], DisputeInBookingResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    __metadata("design:type", Date)
], DisputeInBookingResponseDto.prototype, "createdAt", void 0);
class BookingResponseDto {
    id;
    customerId;
    mechanicId;
    customer;
    mechanic;
    service;
    scheduledAt;
    price;
    status;
    createdAt;
    updatedAt;
    chatRoom;
    payment;
    disputes;
}
exports.BookingResponseDto = BookingResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-booking-id' }),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-customer-id' }),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "customerId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-mechanic-id' }),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "mechanicId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => UserInBookingResponseDto),
    (0, swagger_1.ApiProperty)({ type: UserInBookingResponseDto }),
    __metadata("design:type", UserInBookingResponseDto)
], BookingResponseDto.prototype, "customer", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => MechanicInBookingResponseDto),
    (0, swagger_1.ApiProperty)({ type: MechanicInBookingResponseDto }),
    __metadata("design:type", MechanicInBookingResponseDto)
], BookingResponseDto.prototype, "mechanic", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => ServiceInBookingResponseDto),
    (0, swagger_1.ApiProperty)({ type: ServiceInBookingResponseDto }),
    __metadata("design:type", ServiceInBookingResponseDto)
], BookingResponseDto.prototype, "service", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({
        example: new Date().toISOString(),
        description: 'Scheduled date/time of the booking',
    }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], BookingResponseDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: '150.75', description: 'Total price of the booking (as string for Decimal)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "price", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: client_1.BookingStatus, example: client_1.BookingStatus.CONFIRMED }),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Timestamp when the booking was created' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], BookingResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Timestamp when the booking was last updated' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], BookingResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => ChatRoomInBookingResponseDto),
    (0, swagger_1.ApiProperty)({ type: ChatRoomInBookingResponseDto, required: false, description: 'Associated chat room details' }),
    __metadata("design:type", ChatRoomInBookingResponseDto)
], BookingResponseDto.prototype, "chatRoom", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => PaymentInBookingResponseDto),
    (0, swagger_1.ApiProperty)({ type: PaymentInBookingResponseDto, required: false, description: 'Associated payment details' }),
    __metadata("design:type", PaymentInBookingResponseDto)
], BookingResponseDto.prototype, "payment", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => DisputeInBookingResponseDto),
    (0, swagger_1.ApiProperty)({ type: [DisputeInBookingResponseDto], required: false, description: 'List of disputes related to this booking' }),
    __metadata("design:type", Array)
], BookingResponseDto.prototype, "disputes", void 0);
//# sourceMappingURL=booking.dto.js.map