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
const bcrypt = require('bcryptjs');
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const constant_1 = require("../utils/constant");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async signupCusmtomer(dto) {
        try {
            const { email, password } = dto;
            const foundUser = await this.prisma.user.findUnique({ where: { email } });
            if (foundUser) {
                throw new common_1.BadRequestException('Email Already Exists');
            }
            const hashedPassword = await this.hashPassword(password);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.Role.CUSTOMER,
                },
            });
            return {
                success: true,
                message: 'Sign up was successful',
                data: user,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Sign-up failed. Please try again later.');
        }
    }
    async signupMechanic(dto) {
        try {
            const { email, password } = dto;
            const foundUser = await this.prisma.user.findUnique({ where: { email } });
            if (foundUser) {
                throw new common_1.BadRequestException('Email Already Exists');
            }
            const hashedPassword = await this.hashPassword(password);
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.Role.MECHANIC,
                    status: 'PENDNG',
                },
            });
            return {
                success: true,
                message: 'Sign up was successful',
                data: user,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Sign-up failed. Please try again later.');
        }
    }
    async signin(dto, req, res) {
        try {
            const { email, password } = dto;
            const foundUser = await this.prisma.user.findUnique({ where: { email } });
            if (!foundUser || !foundUser.password) {
                throw new common_1.BadRequestException('Wrong Credentials');
            }
            const isMatch = await this.comparePassword({
                password,
                hashedPassword: foundUser.password,
            });
            if (!isMatch) {
                throw new common_1.BadRequestException('Wrong Credentials');
            }
            const token = await this.signToken({
                id: foundUser.id,
                email: foundUser.email,
                role: foundUser.role,
            });
            if (!token) {
                throw new common_1.ForbiddenException('Token generation failed');
            }
            res.cookie('token', token);
            return res.send({ message: 'Logged in Successfully' });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Sign-in failed. Please try again later.');
        }
    }
    async signout(req, res) {
        try {
            res.clearCookie('token');
            return res.send({ message: 'Logged out successfully' });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Sign-out failed. Please try again later.');
        }
    }
    async hashPassword(password) {
        try {
            const saltOrRounds = 10;
            return await bcrypt.hash(password, saltOrRounds);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Password hashing failed');
        }
    }
    async comparePassword(args) {
        try {
            return await bcrypt.compare(args.password, args.hashedPassword);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Password comparison failed');
        }
    }
    async signToken(args) {
        try {
            const payload = args;
            return this.jwt.signAsync(payload, { secret: constant_1.jwtSecret });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('JWT generation failed');
        }
    }
    async role() {
        return;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map