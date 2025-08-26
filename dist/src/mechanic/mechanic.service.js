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
exports.MechanicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const class_transformer_1 = require("class-transformer");
const service_response_dto_1 = require("./dto/service-response.dto");
const mechanic_profile__response_dto_1 = require("./dto/mechanic-profile--response.dto");
let MechanicService = class MechanicService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMechanicProfile(id) {
        try {
            const mechanic = await this.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    shopName: true,
                    location: true,
                    skills: true,
                    profilePictureUrl: true,
                    bio: true,
                    experienceYears: true,
                    certificationUrls: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
            if (!mechanic) {
                throw new common_1.NotFoundException('Mechanic profile not found');
            }
            return {
                success: true,
                message: 'Mechanic profile Fetched successfully',
                data: (0, class_transformer_1.plainToInstance)(mechanic_profile__response_dto_1.MechanicProfileResponseDto, mechanic, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to get mechanic profile');
        }
    }
    async updateMechanicProfile(id, dto) {
        try {
            const mechanic = await this.prisma.user.update({
                where: { id },
                data: dto,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    shopName: true,
                    location: true,
                    skills: true,
                    profilePictureUrl: true,
                    bio: true,
                    experienceYears: true,
                    certificationUrls: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return {
                success: true,
                message: 'Mechanic profile updated successfully',
                data: (0, class_transformer_1.plainToInstance)(mechanic_profile__response_dto_1.MechanicProfileResponseDto, mechanic, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to update mechanic profile');
        }
    }
    async saveCertification(id, filename) {
        try {
            const updated = await this.prisma.user.update({
                where: { id },
                data: {
                    certificationUrls: { push: filename },
                },
            });
            return {
                success: true,
                message: 'Certification saved successfully',
                data: updated.certificationUrls
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to save certification');
        }
    }
    async uploadProfilePicture(id, file) {
        try {
            const updated = await this.prisma.user.update({
                where: { id },
                data: { profilePictureUrl: file.filename },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    shopName: true,
                    location: true,
                    skills: true,
                    profilePictureUrl: true,
                    bio: true,
                    experienceYears: true,
                    certificationUrls: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return {
                success: true,
                message: 'Profile picture uploaded successfully',
                data: (0, class_transformer_1.plainToInstance)(mechanic_profile__response_dto_1.MechanicProfileResponseDto, updated, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to upload profile picture');
        }
    }
    async createService(mechanicId, dto) {
        try {
            const mechanic = await this.prisma.user.findUnique({
                where: { id: mechanicId },
            });
            if (!mechanic) {
                throw new common_1.NotFoundException('Mechanic not found');
            }
            const service = await this.prisma.mechanicService.create({
                data: { ...dto, mechanicId: mechanicId
                },
            });
            return {
                success: true,
                message: 'Service created successfully',
                data: (0, class_transformer_1.plainToInstance)(service_response_dto_1.ServiceResponseDto, service, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create service');
        }
    }
    async getAllMechanicServices(mechanicId) {
        try {
            const mechanic = await this.prisma.user.findUnique({
                where: { id: mechanicId },
            });
            if (!mechanic) {
                throw new common_1.NotFoundException('Mechanic not found');
            }
            const services = await this.prisma.mechanicService.findMany({
                where: { mechanicId },
            });
            return {
                success: true,
                message: 'Mechanic services retrieved successfully',
                data: (0, class_transformer_1.plainToInstance)(service_response_dto_1.ServiceResponseDto, services, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to retrieve services');
        }
    }
    async updateMechanicService(id, mechanicId, dto) {
        try {
            const existing = await this.prisma.mechanicService.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Service not found');
            }
            if (existing.mechanicId !== mechanicId) {
                throw new common_1.ForbiddenException('You are not authorized to update this service');
            }
            const updated = await this.prisma.mechanicService.update({
                where: { id },
                data: { ...dto },
            });
            return {
                success: true,
                message: 'Service updated successfully',
                data: (0, class_transformer_1.plainToInstance)(service_response_dto_1.ServiceResponseDto, updated, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to update service');
        }
    }
    async deleteMechanicService(id, mechanicId) {
        try {
            const service = await this.prisma.mechanicService.findUnique({
                where: { id },
            });
            if (!service || service.mechanicId !== mechanicId) {
                throw new common_1.ForbiddenException('You are not authorized to delete this service');
            }
            await this.prisma.mechanicService.delete({ where: { id } });
            return {
                success: true,
                message: 'Service deleted successfully',
                data: null,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to delete service');
        }
    }
};
exports.MechanicService = MechanicService;
exports.MechanicService = MechanicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MechanicService);
//# sourceMappingURL=mechanic.service.js.map