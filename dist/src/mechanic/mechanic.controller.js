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
const multer_1 = require("multer");
const path_1 = require("path");
const mechanic_service_1 = require("./mechanic.service");
const roles_guards_1 = require("../common/guard/roles.guards");
const jwt_guard_1 = require("../auth/jwt.guard");
const create_mechanic_service_dto_1 = require("./dto/create-mechanic-service.dto");
const client_1 = require("@prisma/client");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const update_mechanic_dto_1 = require("./dto/update.mechanic.dto");
const swagger_1 = require("@nestjs/swagger");
let MechanicController = class MechanicController {
    mechanicService;
    constructor(mechanicService) {
        this.mechanicService = mechanicService;
    }
    async getMechanicProfile(req) {
        const userId = req.user.id;
        return this.mechanicService.getMechanicProfile(userId);
    }
    async updateMechanicProfile(req, dto) {
        const userId = req.user.id;
        return this.mechanicService.updateMechanicProfile(dto, userId);
    }
    async uploadCertification(file, req) {
        const userId = req.user.id;
        return this.mechanicService.saveCertification(userId, file.filename);
    }
    async uploadProfilePicture(file, req) {
        const userId = req.user.id;
        return this.mechanicService.uploadProfilePicture(userId, file);
    }
    async createMechanicService(req, dto) {
        const userId = req.user.id;
        return this.mechanicService.createService(dto, userId);
    }
    async getAllMechanicServices(req) {
        const userId = req.user.id;
        return this.mechanicService.getallMechanicservice(userId);
    }
    async updateService(req, dto, serviceId) {
        const mechanicId = req.user.id;
        return this.mechanicService.UpdateMechanicService(dto, serviceId, mechanicId);
    }
    async deleteService(req, serviceId) {
        const mechanicId = req.user.id;
        return this.mechanicService.DeleteMechanicService(serviceId, mechanicId);
    }
};
exports.MechanicController = MechanicController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get Mechanic Profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the mechanic profile' }),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "getMechanicProfile", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update Mechanic Profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated' }),
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_mechanic_dto_1.UpdateMechanicDto]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "updateMechanicProfile", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload mechanic certification file' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, common_1.Post)('upload-certification'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/certifications',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "uploadCertification", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload profile picture' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                profilePicture: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, common_1.Post)('profile/upload-picture'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('profilePicture', {
        limits: {
            fileSize: 2 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return callback(new common_1.BadRequestException('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "uploadProfilePicture", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create mechanic service' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Service created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request' }),
    (0, common_1.Post)('service'),
    (0, roles_decorators_1.Roles)(client_1.Role.MECHANIC),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_mechanic_service_dto_1.CreatemechanicService]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "createMechanicService", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all mechanic services' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of services' }),
    (0, common_1.Get)('service'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "getAllMechanicServices", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a mechanic service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service updated' }),
    (0, common_1.Put)('service/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_mechanic_service_dto_1.CreatemechanicService, String]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "updateService", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a mechanic service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service deleted' }),
    (0, common_1.Delete)('service/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MechanicController.prototype, "deleteService", null);
exports.MechanicController = MechanicController = __decorate([
    (0, swagger_1.ApiTags)('Mechanic'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, common_1.Controller)('mechanic'),
    __metadata("design:paramtypes", [mechanic_service_1.MechanicService])
], MechanicController);
//# sourceMappingURL=mechanic.controller.js.map