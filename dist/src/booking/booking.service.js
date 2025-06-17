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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BookingService = class BookingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBooking(dto, serviceId, customerId) {
        const mechanic = await this.prisma.user.findUnique({
            where: { id: dto.mechanicId },
        });
        if (!mechanic) {
            throw new common_1.NotFoundException("Mechanic not found");
        }
        const service = await this.prisma.mechanicService.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            throw new common_1.NotFoundException("Service not found");
        }
        const scheduledDate = new Date(dto.schedudledAt);
        if (isNaN(scheduledDate.getTime())) {
            throw new common_1.BadRequestException('Invalid scheduledAt date');
        }
        return this.prisma.booking.create({
            data: {
                customerId,
                mechanicId: dto.mechanicId,
                serviceId: serviceId,
                scheduledAt: new Date(dto.schedudledAt),
                status: dto.status || 'PENDING',
            },
        });
    }
    async getMechanicBooking(id) {
        this.prisma.booking.findMany({
            where: { id },
            include: {
                service: true,
                customer: true,
            },
        });
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map