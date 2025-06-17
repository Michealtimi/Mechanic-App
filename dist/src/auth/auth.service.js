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
        const { email, password } = dto;
        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (foundUser) {
            throw new common_1.BadRequestException("Email Already Exist");
        }
        const hashedPassword = await this.hashPassword(password);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: client_1.Role.MECHANIC,
            }
        });
        return {
            success: true,
            messalge: 'sign up was succesful',
            data: user,
        };
    }
    async signupMechanic(dto) {
        const { email, password } = dto;
        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (foundUser) {
            throw new common_1.BadRequestException("Email Already Exist");
        }
        const hashedPassword = await this.hashPassword(password);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: client_1.Role.CUSTOMER,
            }
        });
        return {
            success: true,
            messalge: 'sign up was succesful',
            data: user,
        };
    }
    async signin(dto, req, res) {
        const { email, password } = dto;
        const foundUser = await this.prisma.user.findUnique({ where: { email } });
        if (!foundUser) {
            throw new common_1.BadRequestException("Wrong Credentials");
        }
        if (!foundUser.password) {
            throw new common_1.BadRequestException("Wrong Credentials");
        }
        const isMatch = await this.comparePassword({ password, hashedPassword: foundUser.password });
        if (!isMatch) {
            throw new common_1.BadRequestException("Wrong Credentials");
        }
        if (!foundUser.email) {
            throw new common_1.BadRequestException("User email is missing");
        }
        const token = await this.signToken({
            id: foundUser.id,
            email: foundUser.email
        });
        if (!token) {
            throw new common_1.ForbiddenException("Token generation failed");
        }
        res.cookie('token', token);
        return res.send({ message: 'Logged in Succefully' });
    }
    async signout(req, res) {
        res.clearCookie('token');
        return res.send({ message: 'Logged out successfully' });
    }
    async hashPassword(password) {
        const saltOrRounds = 10;
        return await bcrypt.hash(password, saltOrRounds);
    }
    async comparePassword(args) {
        return await bcrypt.compare(args.password, args.hashedPassword);
    }
    async signToken(args) {
        const payload = args;
        return this.jwt.signAsync(payload, { secret: constant_1.jwtSecret });
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