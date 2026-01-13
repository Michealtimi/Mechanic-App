// src/audit/audit.service.ts - Your provided code
// Make sure the import for PrismaService matches its actual location
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path
import { QueryAuditDto } from './dto/query-audit.dto';
import { ProblemDetailsException } from '../common/exceptions/problem-details.exception'; // Adjust path

export interface AuditLogData {
  actor: string;
  entity: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(auditData: AuditLogData) {
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
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      // Don't throw - audit logging should not break the main operation
      return null;
    }
  }

  /**
   * Find all audit logs with filters
   */
  async findAll(queryDto?: QueryAuditDto) {
    const { page = 1, pageSize = 50, ...filters } = queryDto || {};
    const skip = (page - 1) * pageSize;

    const where: any = {};

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

  /**
   * Find audit log by ID
   */
  async findOne(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      throw new ProblemDetailsException({
        status: 404,
        title: 'Not Found',
        detail: `Audit log with ID '${id}' not found`,
        code: 'AUDIT_LOG_NOT_FOUND',
      });
    }

    return auditLog;
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(entity: string, entityId: string) {
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

  /**
   * Export audit logs (for compliance/regulatory requirements)
   */
  async export(queryDto?: QueryAuditDto, format: 'json' | 'csv' = 'json') {
    const where: any = {};

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

  /**
   * Export audit logs to CSV format
   */
  private exportToCSV(auditLogs: any[], queryDto?: QueryAuditDto): string {
    const lines: string[] = [];

    // Header
    lines.push('Audit Log Export');
    lines.push(`Generated At: ${new Date().toISOString()}`);
    if (queryDto) {
      lines.push(`Filters: ${JSON.stringify(queryDto)}`);
    }
    lines.push(`Total Records: ${auditLogs.length}`);
    lines.push('');

    // CSV Header
    lines.push(
      'ID,Timestamp,Actor,Entity,Entity ID,Action,IP Address,User Agent,Before,After,Metadata',
    );

    // CSV Data
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

      lines.push(
        `${log.id},${log.timestamp.toISOString()},${log.actor},${log.entity},${log.entityId},${log.action},${log.ip || ''},${userAgent},"${before}","${after}","${metadata}"`,
      );
    }

    return lines.join('\n');
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

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
}