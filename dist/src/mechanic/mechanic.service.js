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
        this.logger.log(`[getMechanicProfile] Starting fetch for ID: ${id}`);
        this.logger.log(`Attempting to get profile for mechanic ID: ${id}`);
        try {
            if (callerRole !== client_1.Role.ADMIN &&
                callerRole !== client_1.Role.SUPERADMIN &&
                callerRole !== client_1.Role.MECHANIC) {
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
            this.logger.log(`[getMechanicProfile] Successfully fetched profile for ID: ${id}`);
            return mechanic;
        }
        catch (err) {
            this.logger.error(`Failed to get mechanic profile for ID ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve mechanic profile');
        }
    }
    async updateMechanicProfile(id, dto, callerId) {
        this.logger.log(`[updateMechanicProfile] Starting update for ID: ${id}`);
        this.logger.log(`Update request for mechanic ID: ${id} by caller ID: ${callerId}`);
        try {
            if (id !== callerId) {
                this.logger.warn(`Forbidden update attempt on profile ID: ${id} by user ID: ${callerId}`);
                throw new common_1.ForbiddenException('You can only update your own profile.');
            }
            const existingMechanic = await this.prisma.user.findUnique({
                where: { id, role: client_1.Role.MECHANIC },
            });
            if (!existingMechanic) {
                throw new common_1.NotFoundException('Mechanic profile not found.');
            }
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
                this.logger.log(`[updateMechanicProfile] Skills to create: ${skillsToCreateNames.length}`);
                const createdSkills = await this.prisma.$transaction(skillsToCreateNames.map((name) => this.prisma.skill.create({ data: { name } })));
                const allSkills = [...existingSkills, ...createdSkills];
                updateData.skills = {
                    set: allSkills.map((s) => ({ id: s.id })),
                };
            }
            this.logger.log(`[updateMechanicProfile] Final update data for ID: ${id}`);
            const mechanic = await this.prisma.user.update({
                where: { id, role: client_1.Role.MECHANIC },
                data: updateData,
                include: { skills: true },
            });
            this.logger.log(`Successfully updated profile for mechanic ID: ${id}`);
            this.logger.log(`[updateMechanicProfile] Update successful for ID: ${id}`);
            return mechanic;
        }
        catch (err) {
            this.logger.error(`Failed to update mechanic profile for ID: ${id}`, err.stack);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.NotFoundException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to update mechanic profile');
        }
    }
    async uploadProfilePicture(id, filename, callerId) {
        this.logger.log(`[uploadProfilePicture] Attempting upload for user ID: ${id}`);
        this.logger.log(`Upload profile picture request for user ID: ${id}`);
        try {
            if (id !== callerId) {
                throw new common_1.ForbiddenException('You can only update your own profile.');
            }
            const existing = await this.prisma.user.findUnique({
                where: { id, role: client_1.Role.MECHANIC },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Mechanic profile not found.');
            }
            const updatedUser = await this.prisma.user.update({
                where: { id, role: client_1.Role.MECHANIC },
                data: { profilePictureUrl: filename },
            });
            this.logger.log(`Profile picture uploaded for user ID: ${id}`);
            this.logger.log(`[uploadProfilePicture] Filename ${filename} uploaded for user ID: ${id}`);
            return updatedUser;
        }
        catch (err) {
            this.logger.error(`Failed to upload profile picture for user ID: ${id}`, err.stack);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.NotFoundException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to upload profile picture');
        }
    }
    async saveCertification(id, filename, callerId) {
        this.logger.log(`[saveCertification] Attempting save for user ID: ${id}`);
        this.logger.log(`Save certification request for user ID: ${id}`);
        try {
            if (id !== callerId) {
                throw new common_1.ForbiddenException('You can only update your own profile.');
            }
            const existing = await this.prisma.user.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new common_1.NotFoundException('User not found.');
            }
            const updated = await this.prisma.user.update({
                where: { id },
                data: {
                    certificationUrls: { push: filename },
                },
            });
            this.logger.log(`Certification saved for user ID: ${id}`);
            this.logger.log(`[saveCertification] Certification ${filename} saved for user ID: ${id}`);
            return updated.certificationUrls;
        }
        catch (err) {
            this.logger.error(`Failed to save certification for user ID: ${id}`, err.stack);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.NotFoundException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to save certification');
        }
    }
    async createService(mechanicId, dto, callerId) {
        this.logger.log(`[createService] Starting service creation for mechanic ID: ${mechanicId}`);
        this.logger.log(`Create service request for mechanic ID: ${mechanicId}`);
        try {
            if (mechanicId !== callerId) {
                throw new common_1.ForbiddenException('You can only create services for your own account.');
            }
            const mechanic = await this.prisma.user.findUnique({
                where: { id: mechanicId, role: client_1.Role.MECHANIC },
            });
            if (!mechanic) {
                throw new common_1.NotFoundException('Mechanic account not found.');
            }
            const service = await this.prisma.mechanicService.create({
                data: {
                    ...dto,
                    mechanicId: mechanicId,
                },
            });
            this.logger.log(`Service created successfully for mechanic ID: ${mechanicId}`);
            this.logger.log(`[createService] New service ID: ${service.id} created.`);
            return service;
        }
        catch (err) {
            this.logger.error(`Failed to create service for mechanic ID: ${mechanicId}`, err.stack);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.NotFoundException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to create service');
        }
    }
    async getAllMechanicServices(mechanicId, callerId, callerRole) {
        this.logger.log(`[getAllMechanicServices] Starting fetch for mechanic ID: ${mechanicId}`);
        this.logger.log(`Get all services request for mechanic ID: ${mechanicId}`);
        try {
            const isSelfOrAdmin = mechanicId === callerId ||
                callerRole === client_1.Role.ADMIN ||
                callerRole === client_1.Role.SUPERADMIN;
            if (!isSelfOrAdmin) {
                throw new common_1.ForbiddenException('You are not authorized to view these services.');
            }
            const services = await this.prisma.mechanicService.findMany({
                where: { mechanicId },
            });
            this.logger.log(`Found ${services.length} services for mechanic ID: ${mechanicId}`);
            this.logger.log(`[getAllMechanicServices] Found ${services.length} services.`);
            return services;
        }
        catch (err) {
            this.logger.error(`Failed to get all services for mechanic ID: ${mechanicId}`, err.stack);
            if (err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve services');
        }
    }
    async updateMechanicService(id, mechanicId, dto) {
        this.logger.log(`[updateMechanicService] Starting update for service ID: ${id} by mechanic: ${mechanicId}`);
        this.logger.log(`Update service request for service ID: ${id}`);
        try {
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
            this.logger.log(`[updateMechanicService] Service ID: ${id} updated.`);
            return updated;
        }
        catch (err) {
            this.logger.error(`Failed to update service ID: ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to update service');
        }
    }
    async deleteMechanicService(id, mechanicId) {
        this.logger.log(`[deleteMechanicService] Starting delete for service ID: ${id} by mechanic: ${mechanicId}`);
        this.logger.log(`Delete service request for service ID: ${id}`);
        try {
            const service = await this.prisma.mechanicService.findUnique({
                where: { id },
            });
            if (!service || service.mechanicId !== mechanicId) {
                if (!service) {
                    throw new common_1.NotFoundException('Service not found');
                }
                throw new common_1.ForbiddenException('You are not authorized to delete this service');
            }
            await this.prisma.mechanicService.delete({ where: { id } });
            this.logger.log(`Service deleted successfully for service ID: ${id}`);
            this.logger.log(`[deleteMechanicService] Service ID: ${id} deleted.`);
            return {
                success: true,
                message: 'Service deleted successfully',
                data: null,
            };
        }
        catch (err) {
            this.logger.error(`Failed to delete service ID: ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to delete service');
        }
    }
};
exports.MechanicService = MechanicService;
exports.MechanicService = MechanicService = MechanicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MechanicService);
//# sourceMappingURL=mechanic.service.js.map