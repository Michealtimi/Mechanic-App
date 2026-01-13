import { PrismaService } from '../../prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';
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
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(auditData: AuditLogData): Promise<{
        id: string;
        timestamp: Date;
        entity: string;
        entityId: string;
        action: string;
        before: import("@prisma/client/runtime/library").JsonValue | null;
        after: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
        userAgent: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actor: string;
    } | null>;
    findAll(queryDto?: QueryAuditDto): Promise<{
        data: {
            id: string;
            timestamp: Date;
            entity: string;
            entityId: string;
            action: string;
            before: import("@prisma/client/runtime/library").JsonValue | null;
            after: import("@prisma/client/runtime/library").JsonValue | null;
            ip: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actor: string;
        }[];
        pagination: {
            page: any;
            pageSize: any;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        timestamp: Date;
        entity: string;
        entityId: string;
        action: string;
        before: import("@prisma/client/runtime/library").JsonValue | null;
        after: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
        userAgent: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actor: string;
    }>;
    findByEntity(entity: string, entityId: string): Promise<{
        id: string;
        timestamp: Date;
        entity: string;
        entityId: string;
        action: string;
        before: import("@prisma/client/runtime/library").JsonValue | null;
        after: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
        userAgent: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actor: string;
    }[]>;
    export(queryDto?: QueryAuditDto, format?: 'json' | 'csv'): Promise<string | {
        format: string;
        count: number;
        generatedAt: string;
        filters: any;
        logs: {
            id: string;
            timestamp: Date;
            entity: string;
            entityId: string;
            action: string;
            before: import("@prisma/client/runtime/library").JsonValue | null;
            after: import("@prisma/client/runtime/library").JsonValue | null;
            ip: string | null;
            userAgent: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            actor: string;
        }[];
    }>;
    private exportToCSV;
    getStatistics(startDate?: Date, endDate?: Date): Promise<{
        totalLogs: number;
        byAction: {
            action: string;
            count: number;
        }[];
        byEntity: {
            entity: string;
            count: number;
        }[];
        byActor: {
            actor: string;
            count: number;
        }[];
    }>;
}
