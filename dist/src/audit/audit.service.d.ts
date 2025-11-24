import { PrismaService } from 'prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(userId: string, action: string, resource: string, resourceId: string, changes?: any): Promise<void>;
}
