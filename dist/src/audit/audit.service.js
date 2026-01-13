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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const problem_details_exception_1 = require("../common/exceptions/problem-details.exception");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(auditData) {
        try {
            const auditLog = await this.prisma.auditLog.create({
                data: {
                    actor: auditData.actor,
                    entity: auditData.entity,
                    entityId: auditData.entityId,
                    action: auditData.action,
                    before: auditData.before || null,
                    after: auditData.after || null,
                    ip: auditData.ip || null,
                    userAgent: auditData.userAgent || null,
                    metadata: auditData.metadata || {},
                },
            });
            return auditLog;
        }
        catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
            return null;
        }
    }
    async findAll(queryDto) {
        const { page = 1, pageSize = 50, ...filters } = queryDto || {};
        const skip = (page - 1) * pageSize;
        const where = {};
        if (filters.entity) {
            where.entity = filters.entity;
        }
        if (filters.action) {
            where.action = filters.action;
        }
        if (filters.actor) {
            where.actor = filters.actor;
        }
        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) {
                where.timestamp.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.timestamp.lte = endDate;
            }
        }
        const [auditLogs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: {
                    timestamp: 'desc',
                },
                skip,
                take: pageSize,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            data: auditLogs,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findOne(id) {
        const auditLog = await this.prisma.auditLog.findUnique({
            where: { id },
        });
        if (!auditLog) {
            throw new problem_details_exception_1.ProblemDetailsException({
                status: 404,
                title: 'Not Found',
                detail: `Audit log with ID '${id}' not found`,
                code: 'AUDIT_LOG_NOT_FOUND',
            });
        }
        return auditLog;
    }
    async findByEntity(entity, entityId) {
        const auditLogs = await this.prisma.auditLog.findMany({
            where: {
                entity,
                entityId,
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        return auditLogs;
    }
    async export(queryDto, format = 'json') {
        const where = {};
        if (queryDto?.entity) {
            where.entity = queryDto.entity;
        }
        if (queryDto?.action) {
            where.action = queryDto.action;
        }
        if (queryDto?.actor) {
            where.actor = queryDto.actor;
        }
        if (queryDto?.startDate || queryDto?.endDate) {
            where.timestamp = {};
            if (queryDto.startDate) {
                where.timestamp.gte = new Date(queryDto.startDate);
            }
            if (queryDto.endDate) {
                const endDate = new Date(queryDto.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.timestamp.lte = endDate;
            }
        }
        const auditLogs = await this.prisma.auditLog.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
        });
        if (format === 'csv') {
            return this.exportToCSV(auditLogs, queryDto);
        }
        return {
            format: 'json',
            count: auditLogs.length,
            generatedAt: new Date().toISOString(),
            filters: queryDto || {},
            logs: auditLogs,
        };
    }
    exportToCSV(auditLogs, queryDto) {
        const lines = [];
        lines.push('Audit Log Export');
        lines.push(`Generated At: ${new Date().toISOString()}`);
        if (queryDto) {
            lines.push(`Filters: ${JSON.stringify(queryDto)}`);
        }
        lines.push(`Total Records: ${auditLogs.length}`);
        lines.push('');
        lines.push('ID,Timestamp,Actor,Entity,Entity ID,Action,IP Address,User Agent,Before,After,Metadata');
        for (const log of auditLogs) {
            const before = log.before
                ? JSON.stringify(log.before).replace(/,/g, ';')
                : '';
            const after = log.after
                ? JSON.stringify(log.after).replace(/,/g, ';')
                : '';
            const metadata = log.metadata
                ? JSON.stringify(log.metadata).replace(/,/g, ';')
                : '';
            const userAgent = (log.userAgent || '').replace(/,/g, ';');
            lines.push(`${log.id},${log.timestamp.toISOString()},${log.actor},${log.entity},${log.entityId},${log.action},${log.ip || ''},${userAgent},"${before}","${after}","${metadata}"`);
        }
        return lines.join('\n');
    }
    async getStatistics(startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = startDate;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.timestamp.lte = end;
            }
        }
        const [totalLogs, byAction, byEntity, byActor] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: true,
            }),
            this.prisma.auditLog.groupBy({
                by: ['entity'],
                where,
                _count: true,
            }),
            this.prisma.auditLog.groupBy({
                by: ['actor'],
                where,
                _count: true,
            }),
        ]);
        return {
            totalLogs,
            byAction: byAction.map((item) => ({
                action: item.action,
                count: item._count,
            })),
            byEntity: byEntity.map((item) => ({
                entity: item.entity,
                count: item._count,
            })),
            byActor: byActor.map((item) => ({
                actor: item.actor,
                count: item._count,
            })),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map