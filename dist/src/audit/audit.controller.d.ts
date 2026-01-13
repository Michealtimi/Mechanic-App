import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Response } from 'express';
declare enum ExportFormat {
    JSON = "json",
    CSV = "csv"
}
export declare class AuditController {
    private readonly auditService;
    private readonly logger;
    constructor(auditService: AuditService);
    findAll(queryDto: QueryAuditDto): Promise<{
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
    getStatistics(startDate?: string, endDate?: string): Promise<{
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
    exportAuditLogs(queryDto: QueryAuditDto, format: ExportFormat | undefined, res: Response): Promise<string | {
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
}
export {};
