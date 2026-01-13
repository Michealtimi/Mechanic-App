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
const createmechanic_dto_1 = require("./dto/createmechanic.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const client_1 = require("@prisma/client");
const mail_service_1 = require("../utils/mail.service");
const audit_service_1 = require("../audit/audit.service");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    mailService;
    auditService;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma, mailService, auditService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.auditService = auditService;
    }
    async getUserContactDetails(userId) {
        this.logger.debug(`Fetching contact details for user ID: ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                phoneNumber: true,
            },
        });
        if (!user) {
            this.logger.warn(`User with ID ${userId} not found when fetching contact details.`);
            return null;
        }
        this.logger.debug(`Found contact details for user ${userId}: Email=${user.email}, Phone=${user.phoneNumber}`);
        return user;
    }
    async createAndLogUser(dto, callerId = null, callerRole = null) {
        try {
            this.logger.log(`Creating user with email: ${dto.email} and role: ${dto.role}`);
            if (callerRole &&
                callerRole !== client_1.Role.ADMIN &&
                callerRole !== client_1.Role.SUPERADMIN &&
                dto.role !== client_1.Role.CUSTOMER) {
                this.logger.warn(`Forbidden action: User with role ${callerRole} attempted to create a user with role ${dto.role}.`);
                throw new common_1.ForbiddenException('You do not have permission to create users of this role.');
            }
            const email = dto.email.toLowerCase();
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing) {
                throw new common_1.ConflictException('Email already exists');
            }
            const hashedPassword = await bcrypt.hash(dto.password, 12);
            const data = {
                email: email,
                password: hashedPassword,
                role: dto.role,
                firstName: dto.firstName,
                lastName: dto.lastName,
            };
            if (dto.phoneNumber) {
                data.phoneNumber = dto.phoneNumber;
            }
            if (dto.pushToken) {
                data.pushToken = dto.pushToken;
            }
            if (dto.role === client_1.Role.MECHANIC) {
                const mechanicDto = dto;
                data.shopName = mechanicDto.shopName;
                data.status = client_1.Status.PENDING;
                data.isEvSpecialist = mechanicDto.isEvSpecialist ?? false;
                data.serviceRadiusKm = mechanicDto.serviceRadiusKm ?? 20;
                data.currentLat = mechanicDto.currentLat;
                data.currentLng = mechanicDto.currentLng;
                data.bio = mechanicDto.bio;
                data.profilePictureUrl = mechanicDto.profilePictureUrl;
                data.certificationUrls = mechanicDto.certificationUrls ?? [];
                data.averageRating = 0.0;
                data.totalReviews = 0;
                data.totalJobsCompleted = 0;
                if (mechanicDto.skills && mechanicDto.skills.length > 0) {
                    data.skills = {
                        connectOrCreate: mechanicDto.skills.map((skillName) => ({
                            where: { name: skillName },
                            create: { name: skillName },
                        })),
                    };
                }
                if (mechanicDto.experienceYears !== undefined) {
                    data.experienceYears = mechanicDto.experienceYears;
                }
            }
            this.logger.log('Data object being sent to Prisma for creation.');
            const user = await this.prisma.user.create({
                data,
            });
            await this.auditService.log({
                actor: callerId || user.id,
                entity: 'User',
                entityId: user.id,
                action: 'CREATE_USER',
                after: {
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    ...(user.role === client_1.Role.MECHANIC && {
                        shopName: user.shopName,
                        isEvSpecialist: user.isEvSpecialist,
                        serviceRadiusKm: user.serviceRadiusKm,
                        status: user.status,
                    }),
                },
            });
            this.logger.log(`Successfully created user with ID: ${user.id}`);
            return (0, class_transformer_1.plainToInstance)(createmechanic_dto_1.UserResponseDto, user, {
                excludeExtraneousValues: true,
            });
        }
        catch (err) {
            this.logger.error(`Failed to create user`, err.stack);
            if (err instanceof common_1.BadRequestException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.ConflictException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to create user');
        }
    }
    async signupCustomer(dto) {
        try {
            const newUserDto = {
                email: dto.email,
                password: dto.password,
                role: 'CUSTOMER',
                firstName: dto.firstName,
                lastName: dto.lastName,
                phoneNumber: dto.phoneNumber,
                pushToken: dto.pushToken,
            };
            this.logger.log(`Processing signup for new customer: ${newUserDto.email}`);
            const user = await this.createAndLogUser(newUserDto);
            await this.mailService.sendWelcomeEmail(user.email, {
                name: user.firstName || user.email.split('@')[0],
                role: user.role,
                password: newUserDto.password,
            });
            return { success: true, message: 'Customer signup successful', data: user };
        }
        catch (err) {
            this.logger.error(`Customer signup failed`, err.stack);
            if (err instanceof common_1.BadRequestException || err instanceof common_1.ConflictException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Customer signup failed');
        }
    }
    async signupMechanic(dto) {
        try {
            this.logger.log(`Processing signup for new mechanic: ${dto.email}`);
            const user = await this.createAndLogUser(dto);
            await this.mailService.sendWelcomeEmail(user.email, {
                name: user.firstName || user.email.split('@')[0],
                role: user.role,
                password: dto.password,
                shopName: user.shopName,
            });
            return { success: true, message: 'Mechanic signup successful', data: user };
        }
        catch (err) {
            this.logger.error(`Mechanic signup failed`, err.stack);
            if (err instanceof common_1.BadRequestException || err instanceof common_1.ConflictException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Mechanic signup failed');
        }
    }
    async createUser(dto, callerId, callerRole) {
        try {
            this.logger.log(`Admin ${callerId} creating user with email: ${dto.email}`);
            const user = await this.createAndLogUser(dto, callerId, callerRole);
            await this.mailService.sendWelcomeEmail(user.email, {
                name: user.firstName || user.email.split('@')[0],
                role: user.role,
                password: dto.password,
                shopName: user.shopName,
            });
            return { success: true, message: 'User created', data: user };
        }
        catch (err) {
            this.logger.error(`Admin user creation failed`, err.stack);
            if (err instanceof common_1.BadRequestException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.ConflictException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Create user failed');
        }
    }
    async getAllUsers(page = 1, limit = 10, filters) {
        try {
            this.logger.log(`Fetching users with filters: ${JSON.stringify(filters)}`);
            const take = Math.min(Math.max(1, limit), 100);
            const skip = Math.max(0, (page - 1) * take);
            const where = { deletedAt: null };
            if (filters?.role)
                where.role = filters.role;
            if (filters?.status)
                where.status = filters.status;
            if (filters?.isEvSpecialist !== undefined) {
                where.isEvSpecialist = filters.isEvSpecialist;
            }
            if (filters?.isAvailableForJobs !== undefined) {
                where.isAvailableForJobs = filters.isAvailableForJobs;
            }
            if (filters?.minRating !== undefined) {
                where.averageRating = { gte: filters.minRating };
            }
            if (filters?.q) {
                where.OR = [
                    { email: { contains: filters.q, mode: 'insensitive' } },
                    { shopName: { contains: filters.q, mode: 'insensitive' } },
                    { firstName: { contains: filters.q, mode: 'insensitive' } },
                    { lastName: { contains: filters.q, mode: 'insensitive' } },
                    { phoneNumber: { contains: filters.q, mode: 'insensitive' } },
                    {
                        role: client_1.Role.MECHANIC,
                        skills: {
                            some: {
                                name: { contains: filters.q, mode: 'insensitive' },
                            },
                        },
                    },
                ];
            }
            this.logger.log(`Prisma 'where' clause for getAllUsers: ${JSON.stringify(where)}`);
            const [users, total] = await this.prisma.$transaction([
                this.prisma.user.findMany({
                    where,
                    take,
                    skip,
                    include: {
                        skills: { select: { id: true, name: true } },
                    },
                }),
                this.prisma.user.count({ where }),
            ]);
            if (!users.length) {
                this.logger.warn('No users found for the given filters.');
                return {
                    success: true,
                    message: 'No users found for the given criteria.',
                    data: {
                        users: [],
                        pagination: {
                            page,
                            limit: take,
                            total: 0,
                            totalPages: 0,
                        },
                    },
                };
            }
            return {
                success: true,
                message: 'Users retrieved successfully',
                data: {
                    users: (0, class_transformer_1.plainToInstance)(createmechanic_dto_1.UserResponseDto, users, {
                        excludeExtraneousValues: true,
                    }),
                    pagination: {
                        page,
                        limit: take,
                        total,
                        totalPages: Math.ceil(total / take),
                    },
                },
            };
        }
        catch (err) {
            this.logger.error(`Failed to get all users`, err.stack);
            if (err instanceof common_1.NotFoundException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to fetch users');
        }
    }
    async getUserById(id, callerId, callerRole) {
        try {
            this.logger.log(`Searching for user with ID: ${id} by caller: ${callerId}`);
            if (callerId !== id && callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN) {
                this.logger.warn(`Forbidden: Caller ${callerId} tried to access user profile ${id}.`);
                throw new common_1.ForbiddenException('Insufficient permissions to view this user profile');
            }
            const user = await this.prisma.user.findUnique({
                where: { id },
                include: {
                    skills: { select: { id: true, name: true } },
                    mechanicServices: user.role === client_1.Role.MECHANIC ? {
                        select: { id: true, title: true, price: true }
                    } : undefined,
                    reviews: user.role === client_1.Role.MECHANIC ? {
                        select: { id: true, rating: true, comment: true, customer: { select: { firstName: true, lastName: true } } },
                        take: 5,
                        orderBy: { createdAt: 'desc' }
                    } : undefined,
                },
            });
            if (!user) {
                this.logger.warn(`User with ID ${id} not found.`);
                throw new common_1.NotFoundException('User not found');
            }
            this.logger.log(`User found: ${user.email}`);
            return {
                success: true,
                message: 'User retrieved',
                data: (0, class_transformer_1.plainToInstance)(createmechanic_dto_1.UserResponseDto, user, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (err) {
            this.logger.error(`Failed to get user by ID ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve user');
        }
    }
    async updateUser(id, dto, callerId, callerRole) {
        try {
            this.logger.log(`Attempting to update user ${id} with DTO:`, dto, `by caller: ${callerId} (${callerRole})`);
            if (callerId !== id && callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN) {
                this.logger.warn(`Forbidden: Caller ${callerId} tried to update user ${id}.`);
                throw new common_1.ForbiddenException('Insufficient permissions to update this user');
            }
            const existing = await this.prisma.user.findUnique({ where: { id } });
            if (!existing) {
                this.logger.warn(`User ${id} not found for update.`);
                throw new common_1.NotFoundException('User not found');
            }
            const updateData = {};
            if (dto.email)
                updateData.email = dto.email.toLowerCase();
            if (dto.password)
                updateData.password = await bcrypt.hash(dto.password, 12);
            if (dto.firstName !== undefined)
                updateData.firstName = dto.firstName;
            if (dto.lastName !== undefined)
                updateData.lastName = dto.lastName;
            if (dto.phoneNumber !== undefined)
                updateData.phoneNumber = dto.phoneNumber;
            if (dto.pushToken !== undefined)
                updateData.pushToken = dto.pushToken;
            if (dto.bio !== undefined)
                updateData.bio = dto.bio;
            if (dto.profilePictureUrl !== undefined)
                updateData.profilePictureUrl = dto.profilePictureUrl;
            if (dto.certificationUrls !== undefined)
                updateData.certificationUrls = dto.certificationUrls;
            if (callerRole === client_1.Role.ADMIN || callerRole === client_1.Role.SUPERADMIN) {
                if (dto instanceof update_user_dto_1.UpdateUserDto && dto.status !== undefined) {
                    updateData.status = dto.status;
                }
                if (dto instanceof update_user_dto_1.UpdateUserDto && dto.role !== undefined && dto.role !== existing.role) {
                    throw new common_1.BadRequestException("Role changes are not directly handled here or require specific admin logic.");
                }
            }
            if (existing.role === client_1.Role.MECHANIC) {
                const mechanicUpdateDto = dto;
                if (mechanicUpdateDto.shopName !== undefined)
                    updateData.shopName = mechanicUpdateDto.shopName;
                if (mechanicUpdateDto.experienceYears !== undefined)
                    updateData.experienceYears = mechanicUpdateDto.experienceYears;
                if (mechanicUpdateDto.isEvSpecialist !== undefined)
                    updateData.isEvSpecialist = mechanicUpdateDto.isEvSpecialist;
                if (mechanicUpdateDto.serviceRadiusKm !== undefined)
                    updateData.serviceRadiusKm = mechanicUpdateDto.serviceRadiusKm;
                if (mechanicUpdateDto.currentLat !== undefined)
                    updateData.currentLat = mechanicUpdateDto.currentLat;
                if (mechanicUpdateDto.currentLng !== undefined)
                    updateData.currentLng = mechanicUpdateDto.currentLng;
                if (mechanicUpdateDto.isAvailableForJobs !== undefined)
                    updateData.isAvailableForJobs = mechanicUpdateDto.isAvailableForJobs;
                if (mechanicUpdateDto.mechanicOnlineStatus !== undefined)
                    updateData.mechanicOnlineStatus = mechanicUpdateDto.mechanicOnlineStatus;
                if (mechanicUpdateDto.skills !== undefined) {
                    updateData.skills = {
                        set: [],
                        connectOrCreate: mechanicUpdateDto.skills.map((skillName) => ({
                            where: { name: skillName },
                            create: { name: skillName },
                        })),
                    };
                }
            }
            this.logger.log('Final update data for user update.');
            const updated = await this.prisma.user.update({
                where: { id },
                data: updateData,
                include: {
                    skills: true,
                },
            });
            await this.auditService.log({
                actor: callerId,
                entity: 'User',
                entityId: id,
                action: 'UPDATE_USER',
                before: { email: existing.email, status: existing.status, ...((existing.role === client_1.Role.MECHANIC) && { shopName: existing.shopName, isEvSpecialist: existing.isEvSpecialist, serviceRadiusKm: existing.serviceRadiusKm }) },
                after: { email: updated.email, status: updated.status, ...((updated.role === client_1.Role.MECHANIC) && { shopName: updated.shopName, isEvSpecialist: updated.isEvSpecialist, serviceRadiusKm: updated.serviceRadiusKm }) },
                metadata: dto,
            });
            this.logger.log(`Successfully updated user ${id}.`);
            return {
                success: true,
                message: 'User updated successfully',
                data: (0, class_transformer_1.plainToInstance)(createmechanic_dto_1.UserResponseDto, updated, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (err) {
            this.logger.error(`Failed to update user ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.ConflictException ||
                err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to update user');
        }
    }
    async deleteUser(id, callerId, callerRole) {
        try {
            this.logger.log(`Attempting to delete user ${id} by caller: ${callerId} (${callerRole})`);
            if (callerRole !== client_1.Role.ADMIN && callerRole !== client_1.Role.SUPERADMIN) {
                this.logger.warn(`Forbidden: Caller ${callerId} tried to delete user ${id}.`);
                throw new common_1.ForbiddenException('You do not have permission to delete users');
            }
            const existing = await this.prisma.user.findUnique({ where: { id } });
            if (!existing) {
                this.logger.warn(`User ${id} not found for deletion.`);
                throw new common_1.NotFoundException('User not found');
            }
            const deleted = await this.prisma.user.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            await this.auditService.log({
                actor: callerId,
                entity: 'User',
                entityId: id,
                action: 'SOFT_DELETE_USER',
                before: { deletedAt: existing.deletedAt },
                after: { deletedAt: deleted.deletedAt },
            });
            this.logger.log(`Successfully soft-deleted user ${id}.`);
            return {
                success: true,
                message: 'User deleted successfully',
                data: (0, class_transformer_1.plainToInstance)(createmechanic_dto_1.UserResponseDto, deleted, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (err) {
            this.logger.error(`Failed to delete user ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to delete user');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map