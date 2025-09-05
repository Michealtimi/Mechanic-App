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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const class_transformer_1 = require("class-transformer");
const bcrypt = require("bcryptjs");
const client_1 = require("@prisma/client");
const user_response_dto_1 = require("./dto/user-response.dto");
const mail_service_1 = require("../utils/mail.service");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    mailService;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async createAndLogUser(dto, callerId = null, callerRole = null) {
        console.log('Received DTO for user creation:', dto);
        if (callerRole && callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN) {
            this.logger.warn(`Forbidden action: User with role ${callerRole} attempted to create a user.`);
            throw new common_1.ForbiddenException('You do not have permission to create users.');
        }
        const email = dto.email.toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const data = {
            email: email,
            password: hashedPassword,
            role: dto.role,
        };
        if (dto.role === client_1.Role.MECHANIC) {
            data.shopName = dto.shopName;
            data.skills = dto.skills;
            data.status = 'PENDING';
        }
        console.log('Data object being sent to Prisma:', data);
        const user = await this.prisma.user.create({
            data,
        });
        await this.prisma.auditLog.create({
            data: {
                userId: callerId,
                action: 'CREATE_USER',
                resource: 'User',
                resourceId: user.id,
                changes: { created: { email: user.email, role: user.role } },
            },
        });
        console.log('Successfully created user:', user);
        return (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true });
    }
    async signupCustomer(dto) {
        try {
            const newUserDto = {
                email: dto.email,
                password: dto.password,
                role: client_1.Role.CUSTOMER,
            };
            console.log('Customer DTO to be processed:', newUserDto);
            const user = await this.createAndLogUser(newUserDto);
            await this.mailService.sendWelcomeEmail(user.email, {
                name: user.fullName,
                role: user.role,
                password: newUserDto.password,
            });
            return { success: true, message: 'Customer signup successful', data: user };
        }
        catch (error) {
            this.logger.error(`Customer signup failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Customer signup failed');
        }
    }
    async signupMechanic(dto) {
        try {
            const newUserDto = {
                email: dto.email,
                password: dto.password,
                role: client_1.Role.MECHANIC,
                shopName: dto.shopName,
                skills: dto.skills,
            };
            console.log('Mechanic DTO to be processed:', newUserDto);
            const user = await this.createAndLogUser(newUserDto);
            await this.mailService.sendWelcomeEmail(user.email, {
                name: user.fullName,
                role: user.role,
                password: newUserDto.password,
            });
            return { success: true, message: 'Mechanic signup successful', data: user };
        }
        catch (error) {
            this.logger.error(`Mechanic signup failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Mechanic signup failed');
        }
    }
    async createUser(dto, callerId, callerRole) {
        try {
            console.log('Admin user creation DTO:', dto);
            const user = await this.createAndLogUser(dto, callerId, callerRole);
            await this.mailService.sendWelcomeEmail(user.email, {
                name: user.fullName,
                role: user.role,
                password: dto.password,
            });
            return { success: true, message: 'User created', data: user };
        }
        catch (error) {
            this.logger.error(`Admin user creation failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Create user failed');
        }
    }
    async getAllUsers(page = 1, limit = 10, filters) {
        try {
            console.log('Fetching users with filters:', filters);
            const take = Math.min(Math.max(1, limit), 100);
            const skip = Math.max(0, (page - 1) * take);
            const where = { deletedAt: null };
            if (filters?.role)
                where.role = filters.role;
            if (filters?.q) {
                where.OR = [
                    { email: { contains: filters.q, mode: 'insensitive' } },
                    { shopName: { contains: filters.q, mode: 'insensitive' } },
                ];
            }
            console.log('Prisma `where` clause for getAllUsers:', where);
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
            this.logger.error(`Error fetching users: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Error fetching users');
        }
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            success: true,
            message: 'User retrieved',
            data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true }),
        };
    }
    async updateUser(id, dto, callerId, callerRole) {
        if (callerId !== id && callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN) {
            throw new common_1.ForbiddenException('Insufficient permissions to update this user');
        }
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const updateData = {
            ...dto,
            ...(dto.email && { email: dto.email.toLowerCase() }),
            ...(dto.fullName && { fullName: dto.fullName.toUpperCase() }),
        };
        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 12);
        }
        const updated = await this.prisma.user.update({ where: { id }, data: updateData });
        await this.prisma.auditLog.create({
            data: {
                userId: callerId,
                action: 'UPDATE_USER',
                resource: 'User',
                resourceId: id,
                changes: dto,
            },
        });
        return {
            success: true,
            message: 'User updated successfully',
            data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, updated, { excludeExtraneousValues: true }),
        };
    }
    async deleteUser(id, callerId, callerRole) {
        if (callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to delete users');
        }
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const deleted = await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: callerId,
                action: 'SOFT_DELETE_USER',
                resource: 'User',
                resourceId: id,
                changes: { previousDeletedAt: existing.deletedAt, newDeletedAt: deleted.deletedAt },
            },
        });
        return {
            success: true,
            message: 'User deleted successfully',
            data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, deleted, { excludeExtraneousValues: true }),
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map