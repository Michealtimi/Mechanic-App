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
const prisma_service_1 = require("../../prisma/prisma.service");
const class_transformer_1 = require("class-transformer");
const bcrypt = require("bcryptjs");
const client_1 = require("@prisma/client");
const user_response_dto_1 = require("./dto/user-response.dto");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async signupCustomer(dto) {
        try {
            const email = dto.email.toLowerCase();
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing)
                throw new common_1.BadRequestException('Email already exists');
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.Role.CUSTOMER,
                },
            });
            return {
                success: true,
                message: 'Customer signup successful',
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Customer signup failed');
        }
    }
    async signupMechanic(dto) {
        try {
            const email = dto.email.toLowerCase();
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing)
                throw new common_1.BadRequestException('Email already exists');
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const skills = Array.isArray(dto.skills) ? dto.skills.filter(s => typeof s === 'string') : [];
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.Role.MECHANIC,
                    shopName: dto.shopName,
                    skills,
                    status: 'PENDING',
                },
            });
            return {
                success: true,
                message: 'Mechanic signup successful',
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Mechanic signup failed');
        }
    }
    async createUser(dto) {
        try {
            const email = dto.email.toLowerCase();
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing)
                throw new common_1.BadRequestException('Email already exists');
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const role = dto.role ?? client_1.Role.CUSTOMER;
            const user = await this.prisma.user.create({
                data: { email, password: hashedPassword, role },
            });
            return {
                success: true,
                message: 'User created',
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Create user failed');
        }
    }
    async getAllUsers(page = 1, limit = 10) {
        try {
            const take = Math.max(1, limit);
            const skip = Math.max(0, (page - 1) * take);
            const where = { deletedAt: null };
            const [users, total] = await this.prisma.$transaction([
                this.prisma.user.findMany({ where, take, skip }),
                this.prisma.user.count({ where }),
            ]);
            if (!users.length) {
                throw new common_1.NotFoundException('No users found');
            }
            return {
                success: true,
                message: 'Users retrieved successfully',
                data: {
                    users: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, users, { excludeExtraneousValues: true }),
                    pagination: {
                        page,
                        limit: take,
                        total,
                        totalPages: Math.ceil(total / take),
                    },
                },
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Error fetching users');
        }
    }
    async getUserById(id) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            return {
                success: true,
                message: 'User retrieved',
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Error fetching user');
        }
    }
    async updateUser(id, dto) {
        try {
            const existing = await this.prisma.user.findUnique({ where: { id } });
            if (!existing)
                throw new common_1.NotFoundException('User not found');
            const updateData = {
                ...dto,
                ...(dto.email && { email: dto.email.toLowerCase() }),
                ...(dto.fullName && { fullName: dto.fullName.toUpperCase() }),
            };
            if (dto.password) {
                updateData.password = await bcrypt.hash(dto.password, 10);
            }
            const updated = await this.prisma.user.update({ where: { id }, data: updateData });
            return {
                success: true,
                message: 'User updated successfully',
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, updated, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Error updating user');
        }
    }
    async deleteUser(id) {
        try {
            const existing = await this.prisma.user.findUnique({ where: { id } });
            if (!existing)
                throw new common_1.NotFoundException('User not found');
            const deleted = await this.prisma.user.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            return {
                success: true,
                message: 'User deleted successfully',
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, deleted, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Error deleting user');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map