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
exports.MechanicProfileResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MechanicProfileResponseDto {
    id;
    email;
    shopName;
    location;
    skills;
    profilePictureUrl;
    bio;
    experienceYears;
    certificationUrls;
    createdAt;
    updatedAt;
}
exports.MechanicProfileResponseDto = MechanicProfileResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-mechanic', description: 'Unique identifier for the mechanic' }),
    __metadata("design:type", String)
], MechanicProfileResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mechanic@example.com', description: 'Email of the mechanic' }),
    __metadata("design:type", String)
], MechanicProfileResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Joe’s Auto Shop', description: 'Name of the mechanic’s shop' }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "shopName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Lagos, Nigeria', description: 'Location of the mechanic' }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Engine repair', 'Oil change'], description: 'Skills or specialties' }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/profile.jpg', description: 'Profile picture URL' }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Certified Toyota technician', description: 'Short bio' }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Years of experience' }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "experienceYears", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['https://example.com/cert1.pdf', 'https://example.com/cert2.pdf'],
        description: 'URLs of uploaded certifications',
    }),
    __metadata("design:type", Object)
], MechanicProfileResponseDto.prototype, "certificationUrls", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T00:00:00Z', description: 'Profile creation date' }),
    __metadata("design:type", Date)
], MechanicProfileResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-06-01T00:00:00Z', description: 'Last updated date' }),
    __metadata("design:type", Date)
], MechanicProfileResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=mechanic-profile--response.dto.js.map