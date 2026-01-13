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
exports.QueryPaymentsDto = exports.QueryWalletsDto = exports.QueryDisputesDto = exports.RefundPaymentDto = exports.ResolveDisputeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class ResolveDisputeDto {
    resolution;
    refundToCustomer;
    refundAmount;
    debitMechanic;
}
exports.ResolveDisputeDto = ResolveDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The resolution message or notes for the dispute.',
        example: 'Customer refunded due to mechanic no-show.',
    }),
    (0, class_validator_1.IsString)({ message: 'Resolution must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Resolution is required' }),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates whether a refund should be processed to the customer.',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveDisputeDto.prototype, "refundToCustomer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The amount to be refunded/debited (in the smallest currency unit). Required if refundToCustomer or debitMechanic is true.',
        example: 150000,
        minimum: 0,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Refund amount must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Refund amount cannot be negative' }),
    __metadata("design:type", Number)
], ResolveDisputeDto.prototype, "refundAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indicates whether the mechanic should be debited.',
        example: true,
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveDisputeDto.prototype, "debitMechanic", void 0);
class RefundPaymentDto {
    amount;
}
exports.RefundPaymentDto = RefundPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The amount to be refunded (in the smallest currency unit).',
        example: 50000,
        minimum: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Amount must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'Amount must be at least 1' }),
    __metadata("design:type", Number)
], RefundPaymentDto.prototype, "amount", void 0);
class QueryDisputesDto {
    status;
    customerId;
    mechanicId;
    page = 1;
    limit = 10;
}
exports.QueryDisputesDto = QueryDisputesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter disputes by status.',
        enum: client_1.DisputeStatus,
        required: false,
        example: client_1.DisputeStatus.PENDING,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DisputeStatus, { message: 'Invalid dispute status' }),
    __metadata("design:type", String)
], QueryDisputesDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter disputes by customer ID.',
        required: false,
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Customer ID must be a valid UUID' }),
    __metadata("design:type", String)
], QueryDisputesDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter disputes by mechanic ID.',
        required: false,
        example: 'f1e2d3c4-b5a6-9876-5432-10fedcba9876',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Mechanic ID must be a valid UUID' }),
    __metadata("design:type", String)
], QueryDisputesDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number for pagination.',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryDisputesDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page.',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryDisputesDto.prototype, "limit", void 0);
class QueryWalletsDto {
    userId;
    page = 1;
    limit = 10;
}
exports.QueryWalletsDto = QueryWalletsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter wallets by user ID.',
        required: false,
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'User ID must be a valid UUID' }),
    __metadata("design:type", String)
], QueryWalletsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number for pagination.',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryWalletsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page.',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryWalletsDto.prototype, "limit", void 0);
class QueryPaymentsDto {
    userId;
    status;
    page = 1;
    limit = 10;
}
exports.QueryPaymentsDto = QueryPaymentsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter payments by user ID.',
        required: false,
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'User ID must be a valid UUID' }),
    __metadata("design:type", String)
], QueryPaymentsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter payments by status.',
        enum: client_1.PaymentStatus,
        required: false,
        example: client_1.PaymentStatus.SUCCESS,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PaymentStatus, { message: 'Invalid payment status' }),
    __metadata("design:type", String)
], QueryPaymentsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number for pagination.',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryPaymentsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page.',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryPaymentsDto.prototype, "limit", void 0);
//# sourceMappingURL=admin.dto.js.map