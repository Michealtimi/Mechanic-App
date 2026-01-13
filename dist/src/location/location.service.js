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
var GeoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let GeoService = GeoService_1 = class GeoService {
    prisma;
    logger = new common_1.Logger(GeoService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateMechanicLocation(mechanicId, lat, lng) {
        const operation = `Update mechanic ${mechanicId} location`;
        this.logger.log(`[${operation}] new coordinates: lat=${lat}, lng=${lng}`);
        if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
            throw new common_1.BadRequestException('Invalid latitude provided.');
        }
        if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
            throw new common_1.BadRequestException('Invalid longitude provided.');
        }
        try {
            const updatedMechanic = await this.prisma.user.update({
                where: {
                    id: mechanicId,
                    role: client_1.Role.MECHANIC,
                },
                data: { currentLat: lat, currentLng: lng },
            });
            this.logger.log(`[${operation}] successfully updated.`);
            return updatedMechanic;
        }
        catch (error) {
            if (error.code === 'P2025') {
                this.logger.warn(`[${operation}] Mechanic with ID ${mechanicId} not found.`);
                throw new common_1.NotFoundException(`Mechanic with ID ${mechanicId} not found.`);
            }
            this.logger.error(`[${operation}] failed: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to update mechanic location.');
        }
    }
    async findNearbyMechanics(lat, lng, radiusKm = 10) {
        const operation = `Find nearby mechanics for lat=${lat}, lng=${lng} within ${radiusKm}km`;
        this.logger.log(`[${operation}] Initiated.`);
        if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
            throw new common_1.BadRequestException('Invalid latitude provided.');
        }
        if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
            throw new common_1.BadRequestException('Invalid longitude provided.');
        }
        if (typeof radiusKm !== 'number' || isNaN(radiusKm) || radiusKm <= 0) {
            throw new common_1.BadRequestException('Invalid radius provided. Must be a positive number.');
        }
        try {
            const mechanics = await this.prisma.$queryRaw(`
        SELECT
          "id",
          "createdAt",
          "updatedAt",
          "firstName",
          "lastName",
          "email",
          "role",
          "status",
          "isEvSpecialist",
          "serviceRadiusKm",
          "bio",
          "profilePictureUrl",
          "mechanicOnlineStatus",
          "currentLat",
          "currentLng",
          (
            6371 * acos(
              cos(radians(${lat})) * cos(radians("currentLat")) *
              cos(radians("currentLng") - radians(${lng})) +
              sin(radians(${lat})) * sin(radians("currentLat"))
            )
          ) AS distance
        FROM "User"
        WHERE "currentLat" IS NOT NULL AND "currentLng" IS NOT NULL
          AND "role" = 'MECHANIC'
        HAVING distance < ${radiusKm}
        ORDER BY distance ASC;
      `);
            this.logger.log(`[${operation}] Found ${mechanics.length} mechanics.`);
            return mechanics;
        }
        catch (error) {
            this.logger.error(`[${operation}] failed: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to find nearby mechanics.');
        }
    }
};
exports.GeoService = GeoService;
exports.GeoService = GeoService = GeoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GeoService);
//# sourceMappingURL=location.service.js.map