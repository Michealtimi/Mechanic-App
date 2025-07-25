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
exports.bookingResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class bookingResponseDto {
    mechanicId;
    serviceId;
    schedudledAt;
    status;
}
exports.bookingResponseDto = bookingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mechanic id', description: 'Unique ID of the mechanic ' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], bookingResponseDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-service', description: 'Unique ID of the service' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], bookingResponseDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Date the service was created' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], bookingResponseDto.prototype, "schedudledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ststus', description: 'status of Service' }),
    __metadata("design:type", String)
], bookingResponseDto.prototype, "status", void 0);
//# sourceMappingURL=bookingresponse.dto.js.map