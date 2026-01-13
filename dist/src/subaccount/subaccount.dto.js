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
exports.QuerySubaccountsDto = exports.CreateSubaccountDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSubaccountDto {
    businessName;
    bankCode;
    accountNumber;
    percentageCharge;
}
exports.CreateSubaccountDto = CreateSubaccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The official registered business name for the subaccount.', example: 'QuickFix Auto Services Ltd.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSubaccountDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The bank code (e.g., 058 for GTBank in Nigeria). Must be exactly 3 digits.', example: '058' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(3, 3, { message: 'Bank code must be exactly 3 characters (e.g., NIBSS code).' }),
    __metadata("design:type", String)
], CreateSubaccountDto.prototype, "bankCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The recipient bank account number. Usually 10 digits.', example: '0123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(10, 10, { message: 'Account number must be exactly 10 digits.' }),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateSubaccountDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The percentage charge the platform retains from transactions (1-100).', example: 10 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'Percentage charge cannot be negative.' }),
    (0, class_validator_1.Max)(100, { message: 'Percentage charge cannot exceed 100.' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateSubaccountDto.prototype, "percentageCharge", void 0);
class QuerySubaccountsDto {
    page = 1;
    limit = 20;
}
exports.QuerySubaccountsDto = QuerySubaccountsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 1, description: 'Page number for pagination.' }),
    IsOptional(),
    Type(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySubaccountsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 20, description: 'Items per page for pagination.' }),
    IsOptional(),
    Type(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySubaccountsDto.prototype, "limit", void 0);
//# sourceMappingURL=subaccount.dto.js.map