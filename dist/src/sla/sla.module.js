"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaModule = void 0;
const common_1 = require("@nestjs/common");
const sla_service_1 = require("./sla.service");
const sla_controller_1 = require("./sla.controller");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_guard_1 = require("src/auth/jwt.guard");
const roles_guard_1 = require("src/auth/roles.guard");
let SlaModule = class SlaModule {
};
exports.SlaModule = SlaModule;
exports.SlaModule = SlaModule = __decorate([
    (0, common_1.Module)({
        providers: [
            sla_service_1.SlaService,
            prisma_service_1.PrismaService,
            jwt_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
        ],
        controllers: [sla_controller_1.SlaController],
        exports: [sla_service_1.SlaService],
    })
], SlaModule);
//# sourceMappingURL=sla.module.js.map