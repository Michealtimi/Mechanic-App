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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const class_transformer_1 = require("class-transformer");
const user_response_dto_1 = require("../users/dto/user-response.dto");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async signup(dto, role, status = 'ACTIVE') {
        try {
            const { email, password } = dto;
            const foundUser = await this.prisma.user.findUnique({ where: { email } });
            if (foundUser)
                throw new common_1.BadRequestException('Email already exists');
            const hashedPassword = await this.hashPassword(password);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role,
                    status,
                },
            });
            return {
                success: true,
                message: `${role} signup successful`,
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Signup failed. Please try again later.');
        }
    }
    async signin(dto) {
        try {
            const { email, password } = dto;
            const foundUser = await this.prisma.user.findUnique({ where: { email } });
            if (!foundUser || !foundUser.password)
                throw new common_1.UnauthorizedException('Invalid credentials');
            const isMatch = await this.comparePassword(password, foundUser.password);
            if (!isMatch)
                throw new common_1.UnauthorizedException('Invalid credentials');
            const tokens = await this.getTokensAndStoreRefresh(foundUser);
            await this.prisma.user.update({
                where: { id: foundUser.id },
                data: { lastLogin: new Date() },
            });
            return {
                success: true,
                message: 'Login successful',
                ...tokens,
                user: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, foundUser, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Signin failed. Please try again later.');
        }
    }
    async logout(refreshToken) {
        try {
            const payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const jti = payload.jti;
            await this.prisma.refreshToken.update({
                where: { id: jti },
                data: { revoked: true },
            });
            return { message: 'Logged out' };
        }
        catch {
            return { message: 'Logged out' };
        }
    }
    async refreshToken(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        const stored = await this.prisma.refreshToken.findUnique({
            where: { id: payload.jti },
        });
        if (!stored || stored.revoked)
            throw new common_1.ForbiddenException('Refresh token revoked');
        if (stored.expiresAt < new Date()) {
            await this.prisma.refreshToken.update({
                where: { id: stored.id },
                data: { revoked: true },
            });
            throw new common_1.ForbiddenException('Refresh token expired');
        }
        const isMatch = await bcrypt.compare(refreshToken, stored.token);
        if (!isMatch)
            throw new common_1.ForbiddenException('Invalid refresh token');
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user)
            throw new common_1.ForbiddenException('User not found');
        return this.getTokensAndStoreRefresh(user);
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'If an account exists, a reset link was sent.' };
        const resetToken = await this.jwt.signAsync({ sub: user.id }, { secret: this.config.get('JWT_RESET_SECRET'), expiresIn: '1h' });
        return {
            message: 'If an account exists, a reset link was sent.',
            token: resetToken,
        };
    }
    async resetPassword(token, newPassword) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('JWT_RESET_SECRET'),
            });
        }
        catch {
            throw new common_1.ForbiddenException('Invalid or expired reset token');
        }
        const hashed = await this.hashPassword(newPassword);
        await this.prisma.user.update({
            where: { id: payload.sub },
            data: { password: hashed },
        });
        return { message: 'Password reset successful' };
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    async getTokensAndStoreRefresh(user) {
        const jti = (0, uuid_1.v4)();
        const accessPayload = { sub: user.id, email: user.email, role: user.role };
        const refreshPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            jti,
        };
        const accessToken = await this.jwt.signAsync(accessPayload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
        });
        const refreshToken = await this.jwt.signAsync(refreshPayload, {
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
                userId: user.id,
                revoked: false,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    parseDurationToMs(t) {
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
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map