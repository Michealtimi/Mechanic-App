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
exports.ServiceResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ServiceResponseDto {
    id;
    title;
    description;
    price;
    estimatedTime;
    availability;
    mechanicId;
    createdAt;
    updatedAt;
}
exports.ServiceResponseDto = ServiceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-service', description: 'Unique ID of the service' }),
    __metadata("design:type", String)
], ServiceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Oil Change', description: 'Title of the mechanic service' }),
    __metadata("design:type", String)
], ServiceResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Complete engine oil replacement', description: 'Detailed description of the service' }),
    __metadata("design:type", Object)
], ServiceResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000, description: 'Price in Naira or preferred currency' }),
    __metadata("design:type", Number)
], ServiceResponseDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2 hours', description: 'Estimated time to complete the service' }),
    __metadata("design:type", Object)
], ServiceResponseDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Weekdays only', description: 'Mechanic availability for this service' }),
    __metadata("design:type", Object)
], ServiceResponseDto.prototype, "availability", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-mechanic', description: 'ID of the mechanic offering this service' }),
    __metadata("design:type", String)
], ServiceResponseDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Date the service was created' }),
    __metadata("design:type", Date)
], ServiceResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Date the service was last updated' }),
    __metadata("design:type", Date)
], ServiceResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=service-response.dto.js.map