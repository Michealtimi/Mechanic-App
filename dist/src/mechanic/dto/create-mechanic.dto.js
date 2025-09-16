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
exports.CreateMechanicDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateMechanicDto {
    email;
    firstName;
    lastName;
    password;
    shopName;
    location;
    skills;
    experienceYears;
    profilePictureUrl;
    bio;
}
exports.CreateMechanicDto = CreateMechanicDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mechanic@example.com', description: 'Email of the mechanic' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Segun', description: 'FirstName of the mechanic' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Farmer', description: 'LastName of the mechanic' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'securePassword123', description: 'Password for the mechanic account' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SpeedyFix Auto Repair', description: 'Name of the shop' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "shopName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Accra, Ghana', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Brake systems', 'Engine diagnostics'], description: 'Skills of the mechanic' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (Array.isArray(value))
            return value;
        if (typeof value === 'string' && value.trim())
            return [value];
        return undefined;
    }),
    __metadata("design:type", Array)
], CreateMechanicDto.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Years of experience', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateMechanicDto.prototype, "experienceYears", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/profile.jpg', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Expert in Japanese cars', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMechanicDto.prototype, "bio", void 0);
//# sourceMappingURL=create-mechanic.dto.js.map