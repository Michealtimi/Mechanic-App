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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const jwt_auth_guard_1 = require("src/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("src/auth/guards/roles.guard");
const roles_decorator_1 = require("src/auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async createUser(createUserDto) {
        const user = await this.usersService.createUser(createUserDto);
        return (0, class_transformer_1.plainToInstance)(user_dto_1.UserResponseDto, user, { excludeExtraneousValues: true });
    }
    async signupMechanic(signupMechanicDto) {
        signupMechanicDto.role = client_1.Role.MECHANIC;
        const user = await this.usersService.signupMechanic(signupMechanicDto);
        return (0, class_transformer_1.plainToInstance)(user_dto_1.MechanicResponseDto, user, { excludeExtraneousValues: true });
    }
    async findAll(filterDto) {
        const { data, meta } = await this.usersService.findAll(filterDto);
        return {
            data: (0, class_transformer_1.plainToInstance)(user_dto_1.UserResponseDto, data, { excludeExtraneousValues: true }),
            meta,
        };
    }
    async findOne(id, req) {
        const user = await this.usersService.findOne(id, req.user.id, req.user.role);
        const ResponseDto = user.role === client_1.Role.MECHANIC ? user_dto_1.MechanicResponseDto : user_dto_1.UserResponseDto;
        return (0, class_transformer_1.plainToInstance)(ResponseDto, user, { excludeExtraneousValues: true });
    }
    async update(id, updateUserDto, req) {
        const updatedUser = await this.usersService.update(id, updateUserDto, req.user.id, req.user.role);
        const ResponseDto = updatedUser.role === client_1.Role.MECHANIC ? user_dto_1.MechanicResponseDto : user_dto_1.UserResponseDto;
        return (0, class_transformer_1.plainToInstance)(ResponseDto, updatedUser, { excludeExtraneousValues: true });
    }
    async remove(id) {
        await this.usersService.remove(id);
    }
    async updateMechanicAvailability(id, isAvailableForJobs, req) {
        if (id !== req.user.id) {
            throw new ForbiddenException('You can only update your own availability.');
        }
        const updatedMechanic = await this.usersService.updateMechanicAvailability(id, isAvailableForJobs);
        return (0, class_transformer_1.plainToInstance)(user_dto_1.MechanicResponseDto, updatedMechanic, { excludeExtraneousValues: true });
    }
    async updateMechanicOnlineStatus(id, status, req) {
        if (id !== req.user.id) {
            throw new ForbiddenException('You can only update your own online status.');
        }
        const updatedMechanic = await this.usersService.updateMechanicOnlineStatus(id, status);
        return (0, class_transformer_1.plainToInstance)(user_dto_1.MechanicResponseDto, updatedMechanic, { excludeExtraneousValues: true });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof user_dto_1.CreateUserDto !== "undefined" && user_dto_1.CreateUserDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('signup/mechanic'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof user_dto_1.SignupMechanicDto !== "undefined" && user_dto_1.SignupMechanicDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "signupMechanic", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof user_dto_1.UserFilterDto !== "undefined" && user_dto_1.UserFilterDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CUSTOMER, client_1.Role.MECHANIC),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.CUSTOMER, client_1.Role.MECHANIC),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof user_dto_1.UpdateUserDto !== "undefined" && user_dto_1.UpdateUserDto) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/availability'),
    (0, roles_decorator_1.Roles)(client_1.Role.MECHANIC),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isAvailableForJobs')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMechanicAvailability", null);
__decorate([
    (0, common_1.Put)(':id/online-status'),
    (0, roles_decorator_1.Roles)(client_1.Role.MECHANIC),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMechanicOnlineStatus", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map