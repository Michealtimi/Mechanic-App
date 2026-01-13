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
exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.LoginDto = exports.RegisterUserDto = exports.MechanicStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
var MechanicStatus;
(function (MechanicStatus) {
    MechanicStatus["PENDING"] = "PENDING";
    MechanicStatus["APPROVED"] = "APPROVED";
    MechanicStatus["REJECTED"] = "REJECTED";
})(MechanicStatus || (exports.MechanicStatus = MechanicStatus = {}));
class RegisterUserDto {
    email;
    password;
    firstName;
    lastName;
    role;
    isEvSpecialist;
    serviceRadiusKm;
    bio;
    specializations;
    profilePictureUrl;
    status;
}
exports.RegisterUserDto = RegisterUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john.doe@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Password123!', description: 'Minimum 8 characters' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Role, example: client_1.Role.CUSTOMER, description: 'User role' }),
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        required: false,
        description: 'Is the mechanic an EV specialist?',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterUserDto.prototype, "isEvSpecialist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 25,
        required: false,
        description: 'Service radius in kilometers',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], RegisterUserDto.prototype, "serviceRadiusKm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Experienced mechanic specializing in European cars.',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['Toyota', 'Honda'],
        required: false,
        description: 'List of car brands the mechanic specializes in',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterUserDto.prototype, "specializations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://example.com/profile.jpg',
        required: false,
        description: "URL to the mechanic's profile picture",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: MechanicStatus,
        example: MechanicStatus.PENDING,
        required: false,
        description: 'Initial status for a mechanic (defaults to PENDING)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(MechanicStatus),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "status", void 0);
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john.doe@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Password123!' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class ForgotPasswordDto {
    email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john.doe@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
    token;
    newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWT reset token from email' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NewPassword123!', description: 'Minimum 8 characters' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
//# sourceMappingURL=auth.dto.js.map