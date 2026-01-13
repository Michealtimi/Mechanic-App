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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutController = void 0;
const common_1 = require("@nestjs/common");
const payout_service_1 = require("./payout.service");
const payout_dtos_1 = require("./dtos/payout.dtos");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const user_request_interface_1 = require("src/common/interfaces/user-request.interface");
let PayoutController = class PayoutController {
    payoutService;
    constructor(payoutService) {
        this.payoutService = payoutService;
    }
    async requestPayout(req, dto) {
        const mechanicId = req.user.id;
        const result = await this.payoutService.requestPayout(mechanicId, dto);
        return (0, class_transformer_1.plainToInstance)(payout_dtos_1.PayoutResponseDto, result.data, { excludeExtraneousValues: true });
    }
    async markPayoutResult(payoutId, dto) {
        const updatedPayout = await this.payoutService.markPayoutResult(payoutId, dto);
        return (0, class_transformer_1.plainToInstance)(payout_dtos_1.PayoutResponseDto, updatedPayout, { excludeExtraneousValues: true });
    }
    async getPayout(payoutId, req) {
        const payout = await this.payoutService.getPayout(payoutId);
        if (!payout) {
            throw new NotFoundException(`Payout with ID ${payoutId} not found.`);
        }
        if (req.user.role === client_1.Role.MECHANIC && payout.mechanicId !== req.user.id) {
            throw new common_1.HttpStatus(common_1.HttpStatus.FORBIDDEN, 'You are not authorized to view this payout.');
        }
        return (0, class_transformer_1.plainToInstance)(payout_dtos_1.PayoutResponseDto, payout, { excludeExtraneousValues: true });
    }
    async listPayouts(filters) {
        const { data, total, page, limit } = await this.payoutService.listPayouts(filters);
        const transformedData = (0, class_transformer_1.plainToInstance)(payout_dtos_1.PayoutResponseDto, data, { excludeExtraneousValues: true });
        return { data: transformedData, total, page, limit };
    }
};
exports.PayoutController = PayoutController;
__decorate([
    (0, common_1.Post)('request'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.MECHANIC),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Request a payout from a mechanic wallet' }),
    (0, swagger_1.ApiBody)({ type: payout_dtos_1.RequestPayoutDto, description: 'Payout request details' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Payout request initiated successfully.',
        type: payout_dtos_1.PayoutResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (e.g., validation failed, insufficient balance)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (only mechanics can request payouts)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Mechanic not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof user_request_interface_1.UserRequest !== "undefined" && user_request_interface_1.UserRequest) === "function" ? _b : Object, typeof (_c = typeof payout_dtos_1.RequestPayoutDto !== "undefined" && payout_dtos_1.RequestPayoutDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], PayoutController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Update payout status (typically by webhook or internal system)',
        description: 'This endpoint is typically called by a payment gateway webhook or an internal process to update the final status of a payout.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the payout to update', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: payout_dtos_1.UpdatePayoutStatusDto, description: 'New status and relevant details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payout status updated successfully.',
        type: payout_dtos_1.PayoutResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (e.g., validation failed, invalid status transition)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payout not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof payout_dtos_1.UpdatePayoutStatusDto !== "undefined" && payout_dtos_1.UpdatePayoutStatusDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], PayoutController.prototype, "markPayoutResult", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN, client_1.Role.MECHANIC),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific payout' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the payout', type: 'string' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payout details retrieved successfully.',
        type: payout_dtos_1.PayoutResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payout not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_e = typeof user_request_interface_1.UserRequest !== "undefined" && user_request_interface_1.UserRequest) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], PayoutController.prototype, "getPayout", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List all payouts with optional filtering and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'mechanicId', type: 'string', required: false, description: 'Filter by mechanic ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: PayoutStatus, required: false, description: 'Filter by payout status' }),
    (0, swagger_1.ApiQuery)({ name: 'page', type: 'number', required: false, description: 'Page number', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: 'number', required: false, description: 'Items per page', example: 10 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of payouts retrieved successfully.',
        type: [payout_dtos_1.PayoutResponseDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (e.g., validation failed for query parameters)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (only admins can list all payouts)' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof payout_dtos_1.ListPayoutsDto !== "undefined" && payout_dtos_1.ListPayoutsDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], PayoutController.prototype, "listPayouts", null);
exports.PayoutController = PayoutController = __decorate([
    (0, swagger_1.ApiTags)('Payouts'),
    (0, common_1.Controller)('payouts'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })),
    __metadata("design:paramtypes", [typeof (_a = typeof payout_service_1.PayoutService !== "undefined" && payout_service_1.PayoutService) === "function" ? _a : Object])
], PayoutController);
//# sourceMappingURL=payout.controller.js.map