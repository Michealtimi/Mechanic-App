"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvCertModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ev_service_1 = require("./ev.service");
const roles_guards_1 = require("../common/guard/roles.guards");
const ev_controller_1 = require("./ev.controller");
let EvCertModule = class EvCertModule {
};
exports.EvCertModule = EvCertModule;
exports.EvCertModule = EvCertModule = __decorate([
    (0, common_1.Module)({
        providers: [
            ev_service_1.EvCertService,
            prisma_service_1.PrismaService,
            roles_guards_1.RolesGuard,
        ],
        controllers: [ev_controller_1.EvCertController],
        exports: [ev_service_1.EvCertService],
    })
], EvCertModule);
//# sourceMappingURL=ev.module.js.map