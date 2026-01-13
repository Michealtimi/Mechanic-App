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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvCertController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const ev_service_1 = require("./ev.service");
const ev_dto_1 = require("./ev.dto");
const roles_guards_1 = require("../common/guard/roles.guards");
let EvCertController = class EvCertController {
    evCertService;
    constructor(evCertService) {
        this.evCertService = evCertService;
    }
    async upload(req, dto) {
        return this.evCertService.uploadCertification(dto, req.user.id);
    }
    async list(mechanicId) {
        return this.evCertService.listForMechanic(mechanicId);
    }
    async verify(req, certId) {
        return this.evCertService.verifyCertification(certId, req.user.id);
    }
};
exports.EvCertController = EvCertController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.MECHANIC),
    (0, swagger_1.ApiOperation)({ summary: 'Mechanic uploads a new EV certification document URL for verification.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof UserRequest !== "undefined" && UserRequest) === "function" ? _a : Object, ev_dto_1.UploadEvCertDto]),
    __metadata("design:returntype", Promise)
], EvCertController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('mechanic/:mechanicId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve all certification records for a specific mechanic.' }),
    __param(0, (0, common_1.Param)('mechanicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvCertController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id/verify'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'ADMIN action to verify a specific EV certification record.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof UserRequest !== "undefined" && UserRequest) === "function" ? _b : Object, String]),
    __metadata("design:returntype", Promise)
], EvCertController.prototype, "verify", null);
exports.EvCertController = EvCertController = __decorate([
    (0, swagger_1.ApiTags)('EV Certification'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ev-certs'),
    __metadata("design:paramtypes", [ev_service_1.EvCertService])
], EvCertController);
//# sourceMappingURL=ev.controller.js.map