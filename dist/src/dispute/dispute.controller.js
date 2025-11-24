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
exports.DisputeController = void 0;
const common_1 = require("@nestjs/common");
const dispute_service_1 = require("./dispute.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const client_1 = require("@prisma/client");
class RaiseDisputeDto {
    bookingId;
    reason;
}
class ResolveDisputeDto {
    resolution;
    refundAmount;
    isRefundToCustomer;
    isDebitMechanic;
}
let DisputeController = class DisputeController {
    disputeService;
    constructor(disputeService) {
        this.disputeService = disputeService;
    }
    raiseDispute(dto, req) {
        const userId = req.user.id;
        return this.disputeService.raiseDispute(userId, dto.bookingId, dto.reason);
    }
    listAllDisputes() {
        return this.disputeService.listAll();
    }
    resolveDispute(id, dto) {
        return this.disputeService.resolveDispute(id, dto.resolution, dto.refundAmount, dto.isRefundToCustomer, dto.isDebitMechanic);
    }
};
exports.DisputeController = DisputeController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RaiseDisputeDto, Object]),
    __metadata("design:returntype", void 0)
], DisputeController.prototype, "raiseDispute", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DisputeController.prototype, "listAllDisputes", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, common_1.UseGuards)(roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ResolveDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputeController.prototype, "resolveDispute", null);
exports.DisputeController = DisputeController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('disputes'),
    __metadata("design:paramtypes", [dispute_service_1.DisputeService])
], DisputeController);
//# sourceMappingURL=dispute.controller.js.map