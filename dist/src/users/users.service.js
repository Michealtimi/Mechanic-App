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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyUser(id, req) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const decodedUser = req.user;
            if (!decodedUser?.id || user.id !== decodedUser.id) {
                throw new common_1.ForbiddenException('You are not authorized to access this resource');
            }
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async createMechanic(dto) {
        try {
            const hashedPassword = await this.hashPassword(dto.password);
            const skills = this.normalizeSkills(dto.skills);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    role: client_1.Role.MECHANIC,
                    shopName: dto.shopName,
                    location: dto.location,
                    skills,
                },
            });
            const { password, ...rest } = user;
            return rest;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getUsers() {
        try {
            return await this.prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                },
            });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async createUserWithRole(dto) {
        try {
            const hashedPassword = await this.hashPassword(dto.password);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    role: dto.role ?? client_1.Role.CUSTOMER,
                },
            });
            const { password, ...rest } = user;
            return rest;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    normalizeSkills(input) {
        if (Array.isArray(input)) {
            return input.filter((skill) => typeof skill === 'string');
        }
        return typeof input === 'string' ? [input] : [];
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map