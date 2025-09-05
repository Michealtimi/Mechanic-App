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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const signup_customer_dto_1 = require("./dto/signup-customer.dto");
const signup_mechanic_dto_1 = require("./dto/signup-mechanic.dto");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const get_user_decorator_1 = require("../utils/get-user.decorator");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    signupCustomer(dto) {
        return this.usersService.signupCustomer(dto);
    }
    signupMechanic(dto) {
        return this.usersService.signupMechanic(dto);
    }
    createUser(dto, callerId, callerRole) {
        return this.usersService.createUser(dto, callerId, callerRole);
    }
    getAllUsers(page = 1, limit = 10, callerRole) {
        return this.usersService.getAllUsers(Number(page), Number(limit));
    }
    getUserById(id, callerId, callerRole) {
        return this.usersService.getUserById(id);
    }
    updateUser(id, dto, callerId, callerRole) {
        return this.usersService.updateUser(id, dto, callerId, callerRole);
    }
    deleteUser(id, callerId, callerRole) {
        return this.usersService.deleteUser(id, callerId, callerRole);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('signup-customer'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign up as a customer (public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_customer_dto_1.SignupCustomerDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "signupCustomer", null);
__decorate([
    (0, common_1.Post)('signup-mechanic'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign up as a mechanic (public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_mechanic_dto_1.SignupMechanicDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "signupMechanic", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user (Admin-only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __param(2, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (paginated, Admin-only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 10 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (Authenticated)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __param(2, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Authenticated)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)('id')),
    __param(3, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorators_1.Roles)(client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete user (SUPER_ADMIN only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __param(2, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map