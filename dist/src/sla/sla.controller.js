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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaController = void 0;
const common_1 = require("@nestjs/common");
const sla_service_1 = require("./sla.service");
const jwt_guard_1 = require("src/auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("src/auth/roles.guard");
const roles_decorator_1 = require("src/auth/roles.decorator");
const client_1 = require("@prisma/client");
let SlaController = class SlaController {
    sla;
    constructor(sla) {
        this.sla = sla;
    }
    async upsert(bookingId, body) {
        return this.sla.createOrPatchSlaRecord(bookingId, body);
    }
    async get(bookingId) {
        return this.sla.getSla(bookingId);
    }
};
exports.SlaController = SlaController;
__decorate([
    (0, common_1.Post)(':bookingId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SYSTEM),
    (0, swagger_1.ApiOperation)({ summary: 'Records a new timestamp (assignedAt, completedAt, etc.) for a booking.' }),
    (0, swagger_1.ApiBody)({ type: Object, description: 'Partial update object containing the timestamp(s) to record.', examples: {
            assigned: { value: { assignedAt: new Date().toISOString() } },
            completed: { value: { completedAt: new Date().toISOString() } }
        } }),
    __param(0, (0, common_1.Param)('bookingId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "upsert", null);
__decorate([
    (0, common_1.Get)(':bookingId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieves raw SLA record and computed duration metrics for a booking.' }),
    __param(0, (0, common_1.Param)('bookingId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "get", null);
exports.SlaController = SlaController = __decorate([
    (0, swagger_1.ApiTags)('SLA Monitoring'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sla'),
    __metadata("design:paramtypes", [sla_service_1.SlaService])
], SlaController);
//# sourceMappingURL=sla.controller.js.map