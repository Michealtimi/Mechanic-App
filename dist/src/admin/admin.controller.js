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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const client_1 = require("@prisma/client");
const admin_dto_1 = require("./admin.dto");
const admin_service_1 = require("./admin.service.");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
let AdminController = class AdminController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    async listDisputes(query) {
        return this.admin.listDisputes(query);
    }
    async resolveDispute(id, body) {
        return this.admin.resolveDispute(id, body);
    }
    async listWallets(query) {
        return this.admin.listWallets(query);
    }
    async getWalletDetail(id) {
        return this.admin.getWalletDetail(id);
    }
    async refundPayment(id, body) {
        return this.admin.refundPayment(id, body.amount);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('disputes'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a list of all disputes (Paginated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of disputes retrieved.' }),
    (0, swagger_1.ApiQuery)({ type: admin_dto_1.QueryDisputesDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.QueryDisputesDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listDisputes", null);
__decorate([
    (0, common_1.Patch)('disputes/:id/resolve'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a specific dispute, handling refunds/debits' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the dispute' }),
    (0, swagger_1.ApiBody)({ type: admin_dto_1.ResolveDisputeDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Get)('wallets'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a list of all user wallets (Paginated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of wallets retrieved.' }),
    (0, swagger_1.ApiQuery)({ type: admin_dto_1.QueryWalletsDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.QueryWalletsDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listWallets", null);
__decorate([
    (0, common_1.Get)('wallets/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve detailed information for a specific wallet' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the wallet (e.g., user ID or wallet ID)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWalletDetail", null);
__decorate([
    (0, common_1.Patch)('payments/:id/refund'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Process a refund for a payment' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the payment record' }),
    (0, swagger_1.ApiBody)({ type: admin_dto_1.RefundPaymentDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.RefundPaymentDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "refundPayment", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, common_1.Controller)('admin'),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map