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
exports.CreateBookingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateBookingDto {
    mechanicId;
    serviceId;
    schedudledAt;
    status;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mechanic id', description: 'Unique ID of the mechanic ' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-service', description: 'Unique ID of the service' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: new Date().toISOString(), description: 'Date the service was schedule' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateBookingDto.prototype, "schedudledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ststus', description: 'status of Service' }),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "status", void 0);
//# sourceMappingURL=booking.dto.js.map