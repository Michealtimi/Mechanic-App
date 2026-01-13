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
exports.SubaccountController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const subaccount_service_1 = require("./subaccount.service");
const subaccount_dto_1 = require("./subaccount.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const client_1 = require("@prisma/client");
let SubaccountController = class SubaccountController {
    subaccountService;
    constructor(subaccountService) {
        this.subaccountService = subaccountService;
    }
    async createMechanicSubaccount(dto, userId) {
        return this.subaccountService.createMechanicSubaccount(userId, dto);
    }
    async getMechanicSubaccount(userId) {
        return this.subaccountService.getSubaccount(userId);
    }
    async findAll(query) {
        return this.subaccountService.findAll(query);
    }
    async getSubaccountByUserId(userId) {
        return this.subaccountService.getSubaccount(userId);
    }
};
exports.SubaccountController = SubaccountController;
__decorate([
    (0, common_1.Post)('mechanic'),
    (0, roles_decorator_1.Roles)(client_1.Role.MECHANIC),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Create a payment subaccount for the authenticated mechanic' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subaccount successfully created and linked.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (User is not a MECHANIC).' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict (Mechanic already has a subaccount).' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [subaccount_dto_1.CreateSubaccountDto, String]),
    __metadata("design:returntype", Promise)
], SubaccountController.prototype, "createMechanicSubaccount", null);
__decorate([
    (0, common_1.Get)('mechanic'),
    (0, roles_decorator_1.Roles)(client_1.Role.MECHANIC),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve the subaccount details for the authenticated mechanic' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subaccount details retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subaccount not found.' }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubaccountController.prototype, "getMechanicSubaccount", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a paginated list of all subaccounts (Admin/SuperAdmin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'A paginated list of all subaccounts.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (Insufficient role).' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [subaccount_dto_1.QuerySubaccountsDto]),
    __metadata("design:returntype", Promise)
], SubaccountController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve any subaccount by a user ID (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'The ID of the user whose subaccount is requested' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subaccount details retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subaccount not found.' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubaccountController.prototype, "getSubaccountByUserId", null);
exports.SubaccountController = SubaccountController = __decorate([
    (0, swagger_1.ApiTags)('Subaccounts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('subaccounts'),
    __metadata("design:paramtypes", [subaccount_service_1.SubaccountService])
], SubaccountController);
//# sourceMappingURL=subAccount.controller.js.map