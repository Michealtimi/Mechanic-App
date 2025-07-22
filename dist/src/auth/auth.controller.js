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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    signupCustomer(dto, res, req) {
        return this.authService.signupCusmtomer(dto);
    }
    signupMechanic(dto, res, req) {
        return this.authService.signupMechanic(dto);
    }
    signout(res, req) {
        return this.authService.signout(req, res);
    }
    signin(dto, res, req) {
        return this.authService.signin(dto, req, res);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup/customer'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign up as a customer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Customer created' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AuthDto, Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signupCustomer", null);
__decorate([
    (0, common_1.Post)('signup/mechanic'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign up as a mechanic' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'mechanic created' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AuthDto, Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signupMechanic", null);
__decorate([
    (0, common_1.Get)('signout'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign out of the application' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Signed out successfully' }),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signout", null);
__decorate([
    (0, common_1.Post)('signin'),
    (0, swagger_1.ApiOperation)({ summary: 'Signin to the application' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'signedIn' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AuthDto, Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map