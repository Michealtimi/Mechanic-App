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
const constant_1 = require("../utils/constant");
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
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
                data: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, user, { excludeExtraneousValues: true }),
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
            const token = await this.signToken(foundUser);
            return {
                success: true,
                message: 'Login successful',
                token,
                user: (0, class_transformer_1.plainToInstance)(user_response_dto_1.UserResponseDto, foundUser, { excludeExtraneousValues: true }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Signin failed. Please try again later.');
        }
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    async signToken(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return this.jwt.signAsync(payload, { secret: constant_1.jwtSecret, expiresIn: '7d' });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map