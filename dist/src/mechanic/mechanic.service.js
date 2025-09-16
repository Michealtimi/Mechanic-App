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
var MechanicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let MechanicService = MechanicService_1 = class MechanicService {
    prisma;
    logger = new common_1.Logger(MechanicService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMechanicProfile(id, callerRole) {
        this.logger.log(`Attempting to get profile for mechanic ID: ${id}`);
        if (callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN && callerRole !== client_1.Role.MECHANIC) {
            this.logger.warn(`Unauthorized access attempt by role: ${callerRole}`);
            throw new common_1.ForbiddenException('You do not have permission to view this profile.');
        }
        const mechanic = await this.prisma.user.findUnique({
            where: { id, role: client_1.Role.MECHANIC },
            include: {
                skills: true,
            },
        });
        if (!mechanic) {
            this.logger.warn(`Mechanic profile not found for ID: ${id}`);
            throw new common_1.NotFoundException('Mechanic profile not found');
        }
        this.logger.log(`Successfully fetched profile for mechanic ID: ${id}`);
        return mechanic;
    }
    async updateMechanicProfile(id, dto, callerId) {
        this.logger.log(`Update request for mechanic ID: ${id} by caller ID: ${callerId}`);
        if (id !== callerId) {
            this.logger.warn(`Forbidden update attempt on profile ID: ${id} by user ID: ${callerId}`);
            throw new common_1.ForbiddenException('You can only update your own profile.');
        }
        try {
            const updateData = {};
            if (dto.firstName)
                updateData.firstName = dto.firstName;
            if (dto.lastName)
                updateData.lastName = dto.lastName;
            if (dto.shopName)
                updateData.shopName = dto.shopName;
            if (dto.location)
                updateData.location = dto.location;
            if (dto.bio)
                updateData.bio = dto.bio;
            if (dto.experienceYears)
                updateData.experienceYears = dto.experienceYears;
            if (dto.skills && dto.skills.length > 0) {
                const skillNames = dto.skills;
                const existingSkills = await this.prisma.skill.findMany({
                    where: { name: { in: skillNames } },
                });
                const skillsToCreateNames = skillNames.filter((name) => !existingSkills.some((s) => s.name === name));
                const createdSkills = await this.prisma.$transaction(skillsToCreateNames.map((name) => this.prisma.skill.create({ data: { name } })));
                const allSkills = [...existingSkills, ...createdSkills];
                updateData.skills = {
                    set: allSkills.map((s) => ({ id: s.id })),
                };
            }
            const mechanic = await this.prisma.user.update({
                where: { id, role: client_1.Role.MECHANIC },
                data: updateData,
                include: { skills: true }
            });
            this.logger.log(`Successfully updated profile for mechanic ID: ${id}`);
            return mechanic;
        }
        catch (error) {
            this.logger.error(`Failed to update mechanic profile for ID: ${id}. Error: ${error.message}`);
            throw new common_1.BadRequestException(error.message || 'Failed to update mechanic profile');
        }
    }
    async uploadProfilePicture(id, filename, callerId) {
        this.logger.log(`Upload profile picture request for user ID: ${id}`);
        if (id !== callerId) {
            throw new common_1.ForbiddenException('You can only update your own profile.');
        }
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id, role: client_1.Role.MECHANIC },
                data: { profilePictureUrl: filename },
            });
            this.logger.log(`Profile picture uploaded for user ID: ${id}`);
            return updatedUser;
        }
        catch (error) {
            this.logger.error(`Failed to upload profile picture for user ID: ${id}. Error: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Failed to upload profile picture');
        }
    }
    async saveCertification(id, filename, callerId) {
        this.logger.log(`Save certification request for user ID: ${id}`);
        if (id !== callerId) {
            throw new common_1.ForbiddenException('You can only update your own profile.');
        }
        try {
            const updated = await this.prisma.user.update({
                where: { id },
                data: {
                    certificationUrls: { push: filename },
                },
            });
            this.logger.log(`Certification saved for user ID: ${id}`);
            return updated.certificationUrls;
        }
        catch (error) {
            this.logger.error(`Failed to save certification for user ID: ${id}. Error: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Failed to save certification');
        }
    }
    async createService(mechanicId, dto, callerId) {
        this.logger.log(`Create service request for mechanic ID: ${mechanicId}`);
        if (mechanicId !== callerId) {
            throw new common_1.ForbiddenException('You can only create services for your own account.');
        }
        try {
            const service = await this.prisma.mechanicService.create({
                data: {
                    ...dto,
                    mechanicId: mechanicId,
                },
            });
            this.logger.log(`Service created successfully for mechanic ID: ${mechanicId}`);
            return service;
        }
        catch (error) {
            this.logger.error(`Failed to create service for mechanic ID: ${mechanicId}. Error: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create service');
        }
    }
    async getAllMechanicServices(mechanicId, callerId, callerRole) {
        this.logger.log(`Get all services request for mechanic ID: ${mechanicId}`);
        const isSelfOrAdmin = mechanicId === callerId || callerRole === client_1.Role.ADMIN || callerRole === client_1.Role.SUPERADMIN;
        if (!isSelfOrAdmin) {
            throw new common_1.ForbiddenException('You are not authorized to view these services.');
        }
        const services = await this.prisma.mechanicService.findMany({
            where: { mechanicId },
        });
        return services;
    }
    async updateMechanicService(id, mechanicId, dto) {
        this.logger.log(`Update service request for service ID: ${id}`);
        const service = await this.prisma.mechanicService.findUnique({
            where: { id },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        if (service.mechanicId !== mechanicId) {
            throw new common_1.ForbiddenException('You are not authorized to update this service.');
        }
        const updated = await this.prisma.mechanicService.update({
            where: { id },
            data: dto,
        });
        this.logger.log(`Service updated successfully for service ID: ${id}`);
        return updated;
    }
    async deleteMechanicService(id, mechanicId) {
        this.logger.log(`Delete service request for service ID: ${id}`);
        const service = await this.prisma.mechanicService.findUnique({
            where: { id },
        });
        if (!service || service.mechanicId !== mechanicId) {
            throw new common_1.ForbiddenException('You are not authorized to delete this service');
        }
        await this.prisma.mechanicService.delete({ where: { id } });
        this.logger.log(`Service deleted successfully for service ID: ${id}`);
        return {
            success: true,
            message: 'Service deleted successfully',
            data: null,
        };
    }
};
exports.MechanicService = MechanicService;
exports.MechanicService = MechanicService = MechanicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MechanicService);
//# sourceMappingURL=mechanic.service.js.map