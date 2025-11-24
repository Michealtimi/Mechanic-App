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
exports.MechanicController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const mechanic_service_1 = require("./mechanic.service");
const create_mechanic_service_dto_1 = require("./dto/create-mechanic-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const update_mechanic_dto_1 = require("./dto/update.mechanic.dto");
const get_user_decorator_1 = require("../utils/get-user.decorator");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
let MechanicController = class MechanicController {
    mechanicService;
    constructor(mechanicService) {
        this.mechanicService = mechanicService;
    }
    getMechanicProfile(id, callerRole) {
        return this.mechanicService.getMechanicProfile(id, callerRole);
    }
    updateMechanicProfile(callerId, dto) {
        return this.mechanicService.updateMechanicProfile(callerId, dto, callerId);
    }
    saveCertification(callerId, file) {
        return this.mechanicService.saveCertification(callerId, file.filename, callerId);
    }
    uploadProfilePicture(callerId, file) {
        return this.mechanicService.uploadProfilePicture(callerId, file.filename, callerId);
    }
    createService(callerId, dto) {
        return this.mechanicService.createService(callerId, dto, callerId);
    }
    getAllMechanicServices(callerId, callerRole) {
        return this.mechanicService.getAllMechanicServices(callerId, callerId, callerRole);
    }
    updateMechanicService(serviceId, callerId, dto) {
        return this.mechanicService.updateMechanicService(serviceId, callerId, dto);
    }
    deleteMechanicService(serviceId, callerId) {
        return this.mechanicService.deleteMechanicService(serviceId, callerId);
    }
};
exports.MechanicController = MechanicController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof client_1.Role !== "undefined" && client_1.Role) === "function" ? _a : Object]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "getMechanicProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mechanic_dto_1.UpdateMechanicDto]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "updateMechanicProfile", null);
__decorate([
    (0, common_1.Post)('certification'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/certifications',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${file.originalname.slice(-4)}`);
            },
        }),
    })),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "saveCertification", null);
__decorate([
    (0, common_1.Post)('profile-picture'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/profile-pictures',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${file.originalname.slice(-4)}`);
            },
        }),
    })),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "uploadProfilePicture", null);
__decorate([
    (0, common_1.Post)('service'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_mechanic_service_dto_1.CreateMechanicServiceDto]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof client_1.Role !== "undefined" && client_1.Role) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "getAllMechanicServices", null);
__decorate([
    (0, common_1.Patch)('service/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_service_dto_1.UpdateServiceDto]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "updateMechanicService", null);
__decorate([
    (0, common_1.Delete)('service/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MechanicController.prototype, "deleteMechanicService", null);
exports.MechanicController = MechanicController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, common_1.Controller)('mechanic'),
    __metadata("design:paramtypes", [mechanic_service_1.MechanicService])
], MechanicController);
//# sourceMappingURL=mechanic.controller.js.map