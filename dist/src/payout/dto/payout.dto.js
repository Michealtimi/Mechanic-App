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
exports.ListPayoutsDto = exports.UpdatePayoutStatusDto = exports.RequestPayoutDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class RequestPayoutDto {
    amount;
    bankAccountNumber;
    bankCode;
    bankName;
    accountName;
}
exports.RequestPayoutDto = RequestPayoutDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The amount to be paid out, in the smallest currency unit (e.g., kobo, cents).',
        example: '500000',
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.IsNumberString)({}, { message: 'Amount must be a numeric string' }),
    __metadata("design:type", String)
], RequestPayoutDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The bank account number for the payout.',
        example: '0123456789',
        minLength: 10,
        maxLength: 12,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Bank account number is required' }),
    (0, class_validator_1.IsString)({ message: 'Bank account number must be a string' }),
    (0, class_validator_1.MinLength)(10, { message: 'Bank account number must be at least 10 digits' }),
    (0, class_validator_1.MaxLength)(12, { message: 'Bank account number cannot exceed 12 digits' }),
    __metadata("design:type", String)
], RequestPayoutDto.prototype, "bankAccountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The bank code (e.g., NIP code, SWIFT/BIC for international).',
        example: '044',
        minLength: 3,
        maxLength: 10,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Bank code is required' }),
    (0, class_validator_1.IsString)({ message: 'Bank code must be a string' }),
    (0, class_validator_1.MinLength)(3, { message: 'Bank code must be at least 3 characters' }),
    __metadata("design:type", String)
], RequestPayoutDto.prototype, "bankCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The name of the bank.',
        example: 'Guaranty Trust Bank',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestPayoutDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The name of the account holder.',
        example: 'John Doe',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestPayoutDto.prototype, "accountName", void 0);
class UpdatePayoutStatusDto {
    status;
    providerRef;
    failureReason;
    rawGatewayResponse;
}
exports.UpdatePayoutStatusDto = UpdatePayoutStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The new status for the payout.',
        enum: client_1.PayoutStatus,
        example: client_1.PayoutStatus.COMPLETED,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Status is required' }),
    (0, class_validator_1.IsEnum)(client_1.PayoutStatus, { message: 'Invalid payout status' }),
    __metadata("design:type", String)
], UpdatePayoutStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional reference from the payment provider.',
        example: 'TRANSFER_REF_XYZ123',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePayoutStatusDto.prototype, "providerRef", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional reason if the payout failed or was cancelled.',
        example: 'Insufficient funds at gateway',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePayoutStatusDto.prototype, "failureReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional raw response from the payment gateway.',
        type: 'object',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdatePayoutStatusDto.prototype, "rawGatewayResponse", void 0);
class ListPayoutsDto {
    mechanicId;
    status;
    page = 1;
    limit = 10;
}
exports.ListPayoutsDto = ListPayoutsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter payouts by mechanic ID.',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListPayoutsDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter payouts by status.',
        enum: client_1.PayoutStatus,
        example: client_1.PayoutStatus.PENDING,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PayoutStatus, { message: 'Invalid payout status filter' }),
    __metadata("design:type", String)
], ListPayoutsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number for pagination.',
        example: 1,
        default: 1,
        type: Number,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1, { message: 'Page must be at least 1' }),
    __metadata("design:type", Number)
], ListPayoutsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page.',
        example: 10,
        default: 10,
        type: Number,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1, { message: 'Limit must be at least 1' }),
    __metadata("design:type", Number)
], ListPayoutsDto.prototype, "limit", void 0);
//# sourceMappingURL=payout.dto.js.map