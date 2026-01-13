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
exports.DisputeResponseDto = exports.BookingDisputeResponseDto = exports.UserDisputeResponseDto = exports.ResolveDisputeDto = exports.RaiseDisputeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RaiseDisputeDto {
    bookingId;
    reason;
}
exports.RaiseDisputeDto = RaiseDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The ID of the booking related to the dispute', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RaiseDisputeDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The reason for raising the dispute', example: 'Mechanic did not complete the agreed-upon service.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RaiseDisputeDto.prototype, "reason", void 0);
class ResolveDisputeDto {
    resolution;
    refundAmount;
    isRefundToCustomer;
    isDebitMechanic;
}
exports.ResolveDisputeDto = ResolveDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The admin-provided resolution statement for the dispute', example: 'Partial refund issued to customer due to incomplete service.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The amount to be refunded/adjusted as part of the resolution', example: 50.75 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], ResolveDisputeDto.prototype, "refundAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indicates if a refund should be processed to the customer via payment gateway', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveDisputeDto.prototype, "isRefundToCustomer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indicates if the mechanic\'s internal wallet should be debited as part of the resolution', example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveDisputeDto.prototype, "isDebitMechanic", void 0);
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
class UserDisputeResponseDto {
    id;
    firstName;
    lastName;
    role;
}
exports.UserDisputeResponseDto = UserDisputeResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserDisputeResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserDisputeResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserDisputeResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: client_1.Role }),
    __metadata("design:type", String)
], UserDisputeResponseDto.prototype, "role", void 0);
class BookingDisputeResponseDto {
    id;
    customerId;
    mechanicId;
    serviceId;
    totalCost;
}
exports.BookingDisputeResponseDto = BookingDisputeResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingDisputeResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingDisputeResponseDto.prototype, "customerId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingDisputeResponseDto.prototype, "mechanicId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingDisputeResponseDto.prototype, "serviceId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ type: 'number' }),
    __metadata("design:type", Number)
], BookingDisputeResponseDto.prototype, "totalCost", void 0);
class DisputeResponseDto {
    id;
    userId;
    bookingId;
    reason;
    resolution;
    status;
    resolvedAmount;
    createdAt;
    updatedAt;
    user;
    booking;
}
exports.DisputeResponseDto = DisputeResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-dispute-id' }),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-user-id' }),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-booking-id' }),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Service was not completed properly.' }),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "reason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Partial refund issued.', required: false }),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "resolution", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: client_1.DisputeStatus, example: client_1.DisputeStatus.PENDING }),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ type: 'number', example: 50.00, required: false }),
    __metadata("design:type", Number)
], DisputeResponseDto.prototype, "resolvedAmount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], DisputeResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString() }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], DisputeResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => UserDisputeResponseDto),
    (0, swagger_1.ApiProperty)({ type: UserDisputeResponseDto, required: false }),
    __metadata("design:type", UserDisputeResponseDto)
], DisputeResponseDto.prototype, "user", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => BookingDisputeResponseDto),
    (0, swagger_1.ApiProperty)({ type: BookingDisputeResponseDto, required: false }),
    __metadata("design:type", BookingDisputeResponseDto)
], DisputeResponseDto.prototype, "booking", void 0);
//# sourceMappingURL=dispute.dto.js.map