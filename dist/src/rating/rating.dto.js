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
exports.UpdateRatingDto = exports.CreateRatingDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateRatingDto {
    bookingId;
    mechanicId;
    score;
    comment;
}
exports.CreateRatingDto = CreateRatingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The unique ID of the completed Booking this rating applies to.',
        example: 'b7c4a9d0-1e5f-4c8b-8a7e-1d2f3g4h5i6j'
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ID of the Mechanic being rated.',
        example: 'm8e5c1b2-2f6g-4d9c-9b8f-2e3d4c5b6a7f'
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The rating score given (1 to 5).',
        example: 5,
        minimum: 1,
        maximum: 5
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Score must be at least 1.' }),
    (0, class_validator_1.Max)(5, { message: 'Score cannot exceed 5.' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateRatingDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional written review/comment.',
        example: 'Excellent service, quick and professional!'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "comment", void 0);
class UpdateRatingDto {
    score;
    comment;
}
exports.UpdateRatingDto = UpdateRatingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'The updated rating score (1 to 5).',
        example: 4,
        minimum: 1,
        maximum: 5
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Score must be at least 1.' }),
    (0, class_validator_1.Max)(5, { message: 'Score cannot exceed 5.' }),
    __metadata("design:type", Number)
], UpdateRatingDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional updated written review/comment.',
        example: 'The service was good, but the wait time was a bit long.'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRatingDto.prototype, "comment", void 0);
//# sourceMappingURL=rating.dto.js.map