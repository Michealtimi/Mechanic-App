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
exports.MechanicGeoResponseDto = exports.GetNearbyMechanicsDto = exports.UpdateLocationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class UpdateLocationDto {
    lat;
    lng;
}
exports.UpdateLocationDto = UpdateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The latitude coordinate of the location',
        example: 34.052235,
        minimum: -90,
        maximum: 90,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Latitude is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Latitude must be a number' }),
    (0, class_validator_1.IsLatitude)({ message: 'Invalid latitude value' }),
    (0, class_validator_1.Min)(-90, { message: 'Latitude must be between -90 and 90' }),
    (0, class_validator_1.Max)(90, { message: 'Latitude must be between -90 and 90' }),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The longitude coordinate of the location',
        example: -118.243683,
        minimum: -180,
        maximum: 180,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Longitude is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Longitude must be a number' }),
    (0, class_validator_1.IsLongitude)({ message: 'Invalid longitude value' }),
    (0, class_validator_1.Min)(-180, { message: 'Longitude must be between -180 and 180' }),
    (0, class_validator_1.Max)(180, { message: 'Longitude must be between -180 and 180' }),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "lng", void 0);
class GetNearbyMechanicsDto {
    lat;
    lng;
    radiusKm = 10;
}
exports.GetNearbyMechanicsDto = GetNearbyMechanicsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The latitude coordinate of the center point for the search',
        example: 34.052235,
        minimum: -90,
        maximum: 90,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Latitude is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Latitude must be a number' }),
    (0, class_validator_1.IsLatitude)({ message: 'Invalid latitude value' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetNearbyMechanicsDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The longitude coordinate of the center point for the search',
        example: -118.243683,
        minimum: -180,
        maximum: 180,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Longitude is required' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Longitude must be a number' }),
    (0, class_validator_1.IsLongitude)({ message: 'Invalid longitude value' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetNearbyMechanicsDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The search radius in kilometers',
        example: 20,
        default: 10,
        minimum: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Radius must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'Radius must be at least 1 km' }),
    (0, class_validator_1.Max)(200, { message: 'Radius cannot exceed 200 km' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetNearbyMechanicsDto.prototype, "radiusKm", void 0);
class MechanicGeoResponseDto {
    id;
    firstName;
    lastName;
    email;
    role;
    lat;
    lng;
    isEvSpecialist;
    serviceRadiusKm;
    bio;
    specializations;
    profilePictureUrl;
    distance;
}
exports.MechanicGeoResponseDto = MechanicGeoResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    IsString(),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    IsString(),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'john.doe@example.com' }),
    IsString(),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "email", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: client_1.Role, example: client_1.Role.MECHANIC }),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "role", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 34.052235, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MechanicGeoResponseDto.prototype, "lat", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: -118.243683, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MechanicGeoResponseDto.prototype, "lng", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], MechanicGeoResponseDto.prototype, "isEvSpecialist", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 25 }),
    __metadata("design:type", Number)
], MechanicGeoResponseDto.prototype, "serviceRadiusKm", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'Experienced EV mechanic.' }),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "bio", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: ['Tesla', 'Porsche EV'] }),
    __metadata("design:type", Array)
], MechanicGeoResponseDto.prototype, "specializations", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/profile.jpg', nullable: true }),
    __metadata("design:type", String)
], MechanicGeoResponseDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({
        description: 'Distance from the query point in kilometers',
        example: 5.23,
        type: 'number',
        required: false,
    }),
    __metadata("design:type", Number)
], MechanicGeoResponseDto.prototype, "distance", void 0);
//# sourceMappingURL=location.dto.js.map