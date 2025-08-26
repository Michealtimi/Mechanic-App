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
exports.MechanicController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const mechanic_service_1 = require("./mechanic.service");
const create_mechanic_service_dto_1 = require("./dto/create-mechanic-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const service_response_dto_1 = require("./dto/service-response.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const client_1 = require("@prisma/client");
const update_mechanic_dto_1 = require("./dto/update.mechanic.dto");
const mechanic_profile__response_dto_1 = require("./dto/mechanic-profile--response.dto");
let MechanicController = class MechanicController {
    mechanicService;
    constructor(mechanicService) {
        this.mechanicService = mechanicService;
    }
    async getProfile(req) {
        return this.mechanicService.getMechanicProfile(req.user.id);
    }
    async updateProfile(req, dto) {
        return this.mechanicService.updateMechanicProfile(req.user.id, dto);
    }
    async uploadCertification(req, file) {
        return this.mechanicService.saveCertification(req.user.id, file.filename);
    }
    async uploadProfilePicture(req, file) {
        return this.mechanicService.uploadProfilePicture(req.user.id, file);
    }
    async createService(req, dto) {
        return this.mechanicService.createService(req.user.id, dto);
    }
    async getServices(req) {
        return this.mechanicService.getAllMechanicServices(req.user.id);
    }
    async updateService(req, dto, id) {
        return this.mechanicService.updateMechanicService(id, req.user.id, dto);
    }
    async deleteService(req, id) {
        return this.mechanicService.deleteMechanicService(id, req.user.id);
    }
};
exports.MechanicController = MechanicController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get logged-in mechanic profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: mechanic_profile__response_dto_1.MechanicProfileResponseDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update logged-in mechanic profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: mechanic_profile__response_dto_1.MechanicProfileResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_mechanic_dto_1.UpdateMechanicDto]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('certification'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload certification' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "uploadCertification", null);
__decorate([
    (0, common_1.Post)('profile-picture'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload profile picture' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "uploadProfilePicture", null);
__decorate([
    (0, common_1.Post)('service'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a service for logged-in mechanic' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: service_response_dto_1.ServiceResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_mechanic_service_dto_1.CreateMechanicServiceDto]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all services for logged-in mechanic' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [service_response_dto_1.ServiceResponseDto] }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "getServices", null);
__decorate([
    (0, common_1.Patch)('service/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a service for logged-in mechanic' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: service_response_dto_1.ServiceResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_service_dto_1.UpdateServiceDto, String]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('service/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a service for logged-in mechanic' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "deleteService", null);
exports.MechanicController = MechanicController = __decorate([
    (0, swagger_1.ApiTags)('Mechanic'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.MECHANIC),
    (0, common_1.Controller)('mechanic'),
    __metadata("design:paramtypes", [mechanic_service_1.MechanicService])
], MechanicController);
//# sourceMappingURL=mechanic.controller.js.map