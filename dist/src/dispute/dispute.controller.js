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
exports.DisputeController = void 0;
const common_1 = require("@nestjs/common");
const dispute_service_1 = require("./dispute.service");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const client_1 = require("@prisma/client");
const dispute_dto_1 = require("./dto/dispute.dto");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
let DisputeController = class DisputeController {
    disputeService;
    constructor(disputeService) {
        this.disputeService = disputeService;
    }
    async raiseDispute(dto, req) {
        const userId = req.user.id;
        const dispute = await this.disputeService.raiseDispute(userId, dto.bookingId, dto.reason);
        return (0, class_transformer_1.plainToInstance)(dispute_dto_1.DisputeResponseDto, dispute, { excludeExtraneousValues: true });
    }
    async listAllDisputes() {
        const disputes = await this.disputeService.listAll();
        return (0, class_transformer_1.plainToInstance)(dispute_dto_1.DisputeResponseDto, disputes, { excludeExtraneousValues: true });
    }
    async getDisputeById(id) {
        const dispute = await this.disputeService.getDisputeById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found.`);
        }
        return (0, class_transformer_1.plainToInstance)(dispute_dto_1.DisputeResponseDto, dispute, { excludeExtraneousValues: true });
    }
    async resolveDispute(id, dto) {
        const resolvedDispute = await this.disputeService.resolveDispute(id, dto.resolution, dto.refundAmount, dto.isRefundToCustomer, dto.isDebitMechanic);
        return (0, class_transformer_1.plainToInstance)(dispute_dto_1.DisputeResponseDto, resolvedDispute, { excludeExtraneousValues: true });
    }
};
exports.DisputeController = DisputeController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Raise a new dispute for a booking' }),
    (0, swagger_1.ApiBody)({ type: dispute_dto_1.RaiseDisputeDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Dispute raised successfully', type: dispute_dto_1.DisputeResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (e.g., validation failed, pending dispute exists)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (e.g., pending dispute already exists for this booking)' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof dispute_dto_1.RaiseDisputeDto !== "undefined" && dispute_dto_1.RaiseDisputeDto) === "function" ? _a : Object, Object]),
    __metadata("design:returntype", Promise)
], DisputeController.prototype, "raiseDispute", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List all pending disputes (Admin/SuperAdmin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of disputes retrieved successfully', type: [dispute_dto_1.DisputeResponseDto] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (requires ADMIN or SUPERADMIN role)' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DisputeController.prototype, "listAllDisputes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single dispute by ID (Admin/SuperAdmin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dispute retrieved successfully', type: dispute_dto_1.DisputeResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Dispute not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (requires ADMIN or SUPERADMIN role)' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DisputeController.prototype, "getDisputeById", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, common_1.UseGuards)(roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a specific dispute (Admin/SuperAdmin only)' }),
    (0, swagger_1.ApiBody)({ type: dispute_dto_1.ResolveDisputeDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dispute resolved successfully', type: dispute_dto_1.DisputeResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (e.g., validation failed, invalid refund amount)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (e.g., dispute already resolved, insufficient permissions)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Dispute not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error (e.g., financial transaction failed)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof dispute_dto_1.ResolveDisputeDto !== "undefined" && dispute_dto_1.ResolveDisputeDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], DisputeController.prototype, "resolveDispute", null);
exports.DisputeController = DisputeController = __decorate([
    (0, swagger_1.ApiTags)('Disputes'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('disputes'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })),
    __metadata("design:paramtypes", [dispute_service_1.DisputeService])
], DisputeController);
//# sourceMappingURL=dispute.controller.js.map