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
let MechanicService = class MechanicService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMechanicProfile(id) {
        const mechanic = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, role: true }
        });
        if (!mechanic) {
            throw new common_1.NotFoundException('Mechanic profile not found');
        }
        return mechanic;
    }
    async updateMechanicProfile(dto, id) {
        const existing = await this.prisma.user.update({
            where: { id },
            select: { id: true, email: true, role: true },
            data: {
                ...dto,
                skills: Array.isArray(dto.skills) ? dto.skills : (dto.skills ? [dto.skills] : undefined)
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Mechanic profile not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                ...dto,
                id,
                skills: Array.isArray(dto.skills) ? dto.skills : (dto.skills ? [dto.skills] : undefined)
            },
        });
    }
    async saveCertification(id, filename) {
        return this.prisma.user.update({
            where: { id },
            data: {
                certificationUrls: {
                    push: filename
                }
            },
        });
    }
    async uploadProfilePicture(id, file) {
        return this.prisma.user.update({
            where: { id },
            data: {
                profilePictureUrl: file.filename,
            },
        });
    }
    async createService(dto, mechanicId) {
        const mechanic = await this.prisma.user.findUnique({
            where: { id: mechanicId }
        });
        if (!mechanic) {
            throw new common_1.NotFoundException('Mechanic not found');
        }
        ``;
        return this.prisma.mechanicService.create({
            data: {
                ...dto,
                mechanicId: mechanic.id,
            },
        });
    }
    async getallMechanicservice(id) {
        const mechanic = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!mechanic) {
            throw new common_1.NotFoundException('Mechanic not found');
        }
        return this.prisma.mechanicService.findMany({
            where: {
                mechanicId: mechanic.id,
            },
        });
    }
    async UpdateMechanicService(dto, id, mechanicId) {
        const existing = await this.prisma.mechanicService.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Service not found');
        }
        if (existing.mechanicId !== mechanicId) {
            throw new common_1.ForbiddenException('You are not authorized to update this service');
        }
        return this.prisma.mechanicService.update({
            where: { id },
            data: { ...dto },
        });
    }
    async DeleteMechanicService(id, mechanicId) {
        const service = await this.prisma.mechanicService.findUnique({
            where: { id },
        });
        if (!service || service.mechanicId !== mechanicId) {
            throw new common_1.ForbiddenException('You are not authorized to delete this service');
        }
        return this.prisma.mechanicService.delete({
            where: { id }
        });
    }
};
exports.MechanicService = MechanicService;
exports.MechanicService = MechanicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MechanicService);
//# sourceMappingURL=mechanic.service.js.map