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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoController = void 0;
const common_1 = require("@nestjs/common");
const geo_service_1 = require("./geo.service");
const geo_dto_1 = require("./dto/geo.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const roles_guards_1 = require("../common/guard/roles.guards");
const roles_decorators_1 = require("../common/decorators/roles.decorators");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
let GeoController = class GeoController {
    geoService;
    constructor(geoService) {
        this.geoService = geoService;
    }
    async updateLocation(mechanicId, dto, req) {
        const updatedMechanic = await this.geoService.updateMechanicLocation(mechanicId, dto.lat, dto.lng);
        return (0, class_transformer_1.plainToInstance)(geo_dto_1.MechanicGeoResponseDto, updatedMechanic, { excludeExtraneousValues: true });
    }
    async getNearby(query) {
        const nearbyMechanics = await this.geoService.findNearbyMechanics(query.lat, query.lng, query.radiusKm);
        return (0, class_transformer_1.plainToInstance)(geo_dto_1.MechanicGeoResponseDto, nearbyMechanics, { excludeExtraneousValues: true });
    }
    async getMechanicLocation(mechanicId) {
        const mechanic = await this.geoService.getMechanicLocation(mechanicId);
        if (!mechanic) {
            throw new common_1.NotFoundException(`Mechanic with ID ${mechanicId} not found.`);
        }
        return (0, class_transformer_1.plainToInstance)(geo_dto_1.MechanicGeoResponseDto, mechanic, { excludeExtraneousValues: true });
    }
};
exports.GeoController = GeoController;
__decorate([
    (0, common_1.Patch)('mechanic/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guards_1.RolesGuard),
    (0, roles_decorators_1.Roles)(client_1.Role.MECHANIC, client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update a mechanic\'s location' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the mechanic', type: 'string', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    (0, swagger_1.ApiBody)({ type: geo_dto_1.UpdateLocationDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mechanic location updated successfully', type: geo_dto_1.MechanicGeoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (validation failed or invalid input)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (not authorized to update this location)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Mechanic not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof geo_dto_1.UpdateLocationDto !== "undefined" && geo_dto_1.UpdateLocationDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Find nearby mechanics based on given coordinates and radius' }),
    (0, swagger_1.ApiQuery)({ name: 'lat', type: 'number', description: 'Latitude of the search center', example: 34.05 }),
    (0, swagger_1.ApiQuery)({ name: 'lng', type: 'number', description: 'Longitude of the search center', example: -118.24 }),
    (0, swagger_1.ApiQuery)({ name: 'radiusKm', type: 'number', description: 'Search radius in kilometers (default: 10)', required: false, example: 25 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of nearby mechanics retrieved successfully', type: [geo_dto_1.MechanicGeoResponseDto] }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (validation failed for query parameters)' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof geo_dto_1.GetNearbyMechanicsDto !== "undefined" && geo_dto_1.GetNearbyMechanicsDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "getNearby", null);
__decorate([
    (0, common_1.Get)('mechanic/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific mechanic\'s location' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID of the mechanic', type: 'string', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mechanic location retrieved successfully', type: geo_dto_1.MechanicGeoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Mechanic not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "getMechanicLocation", null);
exports.GeoController = GeoController = __decorate([
    (0, swagger_1.ApiTags)('Geo-Location'),
    (0, common_1.Controller)('geo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })),
    __metadata("design:paramtypes", [typeof (_a = typeof geo_service_1.GeoService !== "undefined" && geo_service_1.GeoService) === "function" ? _a : Object])
], GeoController);
//# sourceMappingURL=location.controller.js.map