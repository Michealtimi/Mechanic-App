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
var SlaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SlaService = SlaService_1 = class SlaService {
    prisma;
    logger = new common_1.Logger(SlaService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrPatchSlaRecord(bookingId, patch) {
        const op = `SLA upsert for booking ${bookingId}`;
        this.logger.log(`Starting ${op}`);
        try {
            const upserted = await this.prisma.slaRecord.upsert({
                where: { bookingId },
                update: patch,
                create: { bookingId, ...patch },
            });
            this.logger.debug(`[${op}] Successfully upserted SLA record.`);
            return upserted;
        }
        catch (err) {
            this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException('SLA upsert failed');
        }
    }
    async getSla(bookingId) {
        const op = `GetSLA for booking ${bookingId}`;
        const rec = await this.prisma.slaRecord.findUnique({ where: { bookingId } });
        if (!rec) {
            this.logger.warn(`[${op}] SLA record not found.`);
            throw new common_1.NotFoundException('SLA record not found for this booking.');
        }
        const dur = {
            acceptDelayMs: rec.assignedAt && rec.mechanicAcceptedAt ? rec.mechanicAcceptedAt.getTime() - rec.assignedAt.getTime() : null,
            arrivalDelayMs: rec.mechanicAcceptedAt && rec.mechanicArrivedAt ? rec.mechanicArrivedAt.getTime() - rec.mechanicAcceptedAt.getTime() : null,
            totalJobMs: rec.assignedAt && rec.completedAt ? rec.completedAt.getTime() - rec.assignedAt.getTime() : null,
        };
        return { record: rec, metrics: dur };
    }
};
exports.SlaService = SlaService;
exports.SlaService = SlaService = SlaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SlaService);
//# sourceMappingURL=sla.service.js.map