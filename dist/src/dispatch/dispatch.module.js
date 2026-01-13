"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_service_1 = require("./dispatch.service");
const dispatch_controller_1 = require("./dispatch.controller");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
let DispatchModule = class DispatchModule {
};
exports.DispatchModule = DispatchModule;
exports.DispatchModule = DispatchModule = __decorate([
    (0, common_1.Module)({
        providers: [
            dispatch_service_1.DispatchService,
            prisma_service_1.PrismaService,
            notification_gateway_1.NotificationGateway,
        ],
        controllers: [dispatch_controller_1.DispatchController],
        imports: [],
        exports: [dispatch_service_1.DispatchService],
    })
], DispatchModule);
//# sourceMappingURL=dispatch.module.js.map