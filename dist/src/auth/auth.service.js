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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcryptjs");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const class_transformer_1 = require("class-transformer");
const user_response_dto_1 = require("../users/dto/user-response.dto");
const mail_service_1 = require("../utils/mail.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    config;
    mailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, config, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.mailService = mailService;
    }
    async register(dto) {
        this.logger.log(`Attempting to register user with email: ${dto.email}`);
        const exists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (exists) {
            this.logger.warn(`Registration failed: Email '${dto.email}' already in use.`);
            throw new common_1.BadRequestException('Email already in use');
        }
        const hashedPassword = await this.hashPassword(dto.password);
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    role: dto.role,
                },
            });
            try {
                const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                await this.mailService.sendWelcomeEmail(user.email, {
                    name: userName,
                    role: user.role,
                });
            }
            catch (err) {
                this.logger.warn(`Welcome email failed for ${user.email}. Error: ${err.message || err}`);
            }
            this.logger.log(`User registered successfully with ID: ${user.id}`);
            const { password, ...rest } = user;
            return rest;
        }
        catch (error) {
            this.logger.error(`Registration failed. Error: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || 'Signup failed. Please try again later.');
        }
    }
    async login(dto) {
        this.logger.log(`Login attempt for email: ${dto.email}`);
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.password) {
            this.logger.warn(`Login failed: Invalid credentials for email '${dto.email}'.`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isMatch = await this.comparePassword(dto.password, user.password);
        if (!isMatch) {
            this.logger.warn(`Login failed: Incorrect password for user '${dto.email}'.`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.getTokensAndStoreRefresh(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        this.logger.log(`User logged in and lastLogin updated for ID: ${user.id}`);
        return {
            success: true,
            message: 'Login successful',
            user: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
                excludeExtraneousValues: true,
            }),
            ...tokens,
        };
    }
    async logout(refreshToken) {
        this.logger.log('Logout requested, revoking refresh token.');
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const jti = payload.jti;
            const rt = await this.prisma.refreshToken.findUnique({
                where: { id: jti },
            });
            if (!rt) {
                this.logger.warn(`Logout failed: Refresh token with ID ${jti} not found.`);
                throw new common_1.BadRequestException('Refresh token not found');
            }
            await this.prisma.refreshToken.update({
                where: { id: jti },
                data: { revoked: true },
            });
            this.logger.log(`Refresh token with ID ${jti} successfully revoked.`);
            return { message: 'Logged out' };
        }
        catch (error) {
            this.logger.error(`Logout failed. Error: ${error.message || error}`);
            return { message: 'Logged out' };
        }
    }
    async refreshToken(refreshToken) {
        this.logger.log('Refresh token request received.');
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            this.logger.error('Invalid refresh token provided.');
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        const jti = payload.jti;
        const userId = payload.sub;
        const stored = await this.prisma.refreshToken.findUnique({
            where: { id: jti },
        });
        if (!stored || stored.revoked) {
            this.logger.warn(`Refresh token with ID ${jti} is revoked or not found.`);
            throw new common_1.ForbiddenException('Refresh token revoked');
        }
        if (stored.expiresAt < new Date()) {
            this.logger.warn(`Refresh token with ID ${jti} is expired.`);
            await this.prisma.refreshToken.update({
                where: { id: stored.id },
                data: { revoked: true },
            });
            throw new common_1.ForbiddenException('Refresh token expired');
        }
        const isMatch = await bcrypt.compare(refreshToken, stored.token);
        if (!isMatch) {
            this.logger.error(`Hash mismatch for refresh token with ID ${jti}. Revoking token.`);
            await this.prisma.refreshToken.update({
                where: { id: stored.id },
                data: { revoked: true },
            });
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });
        this.logger.log(`Old refresh token with ID ${jti} revoked.`);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            this.logger.error(`User with ID ${userId} not found during refresh token process.`);
            throw new common_1.ForbiddenException('User not found');
        }
        const newTokens = await this.getTokensAndStoreRefresh(user.id, user.email, user.role);
        this.logger.log(`New access and refresh tokens issued for user ${user.id}`);
        return newTokens;
    }
    async forgotPassword(dto) {
        this.logger.log(`Password reset requested for email: ${dto.email}`);
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            this.logger.log('User not found. Returning generic success message to prevent user enumeration.');
            return { message: 'If an account exists, a reset link was sent.' };
        }
        const resetToken = await this.jwtService.signAsync({ sub: user.id }, { secret: this.config.get('JWT_RESET_SECRET'), expiresIn: '1h' });
        const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
        try {
            await this.mailService.sendMail(user.email, 'Password Reset Request', `You requested a password reset. Please click the link to reset your password: ${resetUrl}`, `
          <p>Hello ${user.firstName ?? ''},</p>
          <p>You requested a password reset. Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">Reset password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
        `);
            this.logger.log(`Password reset email sent to ${user.email}`);
        }
        catch (err) {
            this.logger.error(`Failed to send password reset email to ${user.email}. Error: ${err}`);
            throw new common_1.InternalServerErrorException('Failed to send reset email');
        }
        return { message: 'If an account exists, a reset link was sent.' };
    }
    async resetPassword(dto) {
        this.logger.log('Password reset request received.');
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(dto.token, {
                secret: this.config.get('JWT_RESET_SECRET'),
            });
        }
        catch {
            this.logger.error('Invalid or expired reset token provided.');
            throw new common_1.ForbiddenException('Invalid or expired reset token');
        }
        const userId = payload.sub;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            this.logger.warn(`Password reset failed: User with ID ${userId} not found.`);
            throw new common_1.BadRequestException('User not found');
        }
        const hashed = await this.hashPassword(dto.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        this.logger.log(`Password successfully reset for user ID: ${userId}`);
        return { message: 'Password reset successful' };
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    async getTokensAndStoreRefresh(userId, email, role) {
        const jti = (0, uuid_1.v4)();
        const accessPayload = { sub: userId, email, role };
        const refreshPayload = { sub: userId, email, role, jti };
        const accessToken = await this.jwtService.signAsync(accessPayload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES') || '15m',
        });
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES') || '7d',
        });
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date(Date.now() +
            this.parseDurationToMs(this.config.get('JWT_REFRESH_EXPIRES') || '7d'));
        await this.prisma.refreshToken.create({
            data: {
                id: jti,
                token: hashedRefreshToken,
                userId,
                revoked: false,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    parseDurationToMs(t) {
        if (!t)
            return 7 * 24 * 60 * 60 * 1000;
        const num = parseInt(t.replace(/\D/g, ''), 10);
        if (t.endsWith('d'))
            return num * 24 * 60 * 60 * 1000;
        if (t.endsWith('h'))
            return num * 60 * 60 * 1000;
        if (t.endsWith('m'))
            return num * 60 * 1000;
        if (t.endsWith('s'))
            return num * 1000;
        return num * 1000;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map