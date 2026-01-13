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
exports.UploadEvCertDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UploadEvCertDto {
    mechanicId;
    certUrl;
    provider;
}
exports.UploadEvCertDto = UploadEvCertDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The unique ID of the Mechanic uploading the certificate.',
        example: 'm8e5c1b2-2f6g-4d9c-9b8f-2e3d4c5b6a7f'
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadEvCertDto.prototype, "mechanicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The publicly accessible URL pointing to the EV certification document (image or PDF).',
        example: 'https://storage.example.com/certificates/mechanic_ev_cert.pdf'
    }),
    (0, class_validator_1.IsUrl)({}, { message: 'certUrl must be a valid URL.' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 2048),
    __metadata("design:type", String)
], UploadEvCertDto.prototype, "certUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Name of the certifying organization or training provider (e.g., Tesla, SAE, third-party school).',
        example: 'SAE Hybrid/EV Specialist Certification'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 255),
    __metadata("design:type", String)
], UploadEvCertDto.prototype, "provider", void 0);
//# sourceMappingURL=ev.dto.js.map