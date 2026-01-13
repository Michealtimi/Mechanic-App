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
exports.WsAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../../prisma/prisma.service");
let WsAuthGuard = class WsAuthGuard {
    jwtService;
    prisma;
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = client.handshake.auth.token || client.handshake.query.token;
        if (!token) {
            throw new websockets_1.WsException('Unauthorized: No token provided');
        }
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user) {
                throw new websockets_1.WsException('Unauthorized: User not found');
            }
            client.data.user = user;
            return true;
        }
        catch (e) {
            throw new websockets_1.WsException(`Unauthorized: ${e.message}`);
        }
    }
};
exports.WsAuthGuard = WsAuthGuard;
exports.WsAuthGuard = WsAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], WsAuthGuard);
//# sourceMappingURL=ws-auth.guard.js.map