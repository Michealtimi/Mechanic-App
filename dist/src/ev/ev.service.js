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
var EvCertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvCertService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let EvCertService = EvCertService_1 = class EvCertService {
    prisma;
    logger = new common_1.Logger(EvCertService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadCertification(dto, callerId) {
        const op = `UploadEvCert for mechanic ${dto.mechanicId}`;
        this.logger.log(`Starting ${op}`);
        try {
            if (dto.mechanicId !== callerId) {
                throw new common_1.ForbiddenException('You can only add certifications for your own profile.');
            }
            const mech = await this.prisma.user.findUnique({
                where: { id: dto.mechanicId, role: client_1.Role.MECHANIC }
            });
            if (!mech) {
                throw new common_1.NotFoundException('Mechanic not found or invalid role.');
            }
            const rec = await this.prisma.evCertification.create({
                data: {
                    mechanicId: dto.mechanicId,
                    certUrl: dto.certUrl,
                    provider: dto.provider,
                    verified: false,
                },
            });
            this.logger.log(`[${op}] Certificate ID ${rec.id} uploaded successfully.`);
            return rec;
        }
        catch (err) {
            this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to upload EV certification.');
        }
    }
    async verifyCertification(certId, verifierId) {
        const op = `VerifyEvCert ${certId} by ${verifierId}`;
        this.logger.log(`Starting ${op}`);
        try {
            const rec = await this.prisma.evCertification.findUnique({ where: { id: certId } });
            if (!rec) {
                throw new common_1.NotFoundException('Certification not found.');
            }
            if (rec.verified) {
                this.logger.warn(`[${op}] Certificate already verified.`);
                return rec;
            }
            const updatedCert = await this.prisma.$transaction(async (tx) => {
                const cert = await tx.evCertification.update({
                    where: { id: certId },
                    data: {
                        verified: true,
                        verifiedBy: verifierId,
                        verifiedAt: new Date()
                    },
                });
                const verifiedCount = await tx.evCertification.count({
                    where: { mechanicId: cert.mechanicId, verified: true }
                });
                if (verifiedCount > 0) {
                    await tx.user.update({
                        where: { id: cert.mechanicId, role: client_1.Role.MECHANIC },
                        data: {
                            isEvSpecialist: true,
                            lastCertificationVerifiedAt: new Date(),
                        }
                    });
                }
                return cert;
            });
            this.logger.log(`[${op}] Successfully verified certificate and updated mechanic profile.`);
            return updatedCert;
        }
        catch (err) {
            this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to verify EV certification.');
        }
    }
    async listForMechanic(mechanicId) {
        return this.prisma.evCertification.findMany({
            where: { mechanicId },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.EvCertService = EvCertService;
exports.EvCertService = EvCertService = EvCertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EvCertService);
//# sourceMappingURL=ev.service.js.map