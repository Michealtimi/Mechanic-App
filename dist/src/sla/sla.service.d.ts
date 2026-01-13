import { PrismaService } from 'prisma/prisma.service';
type SlaPatch = Partial<{
    assignedAt: Date;
    mechanicAcceptedAt: Date;
    mechanicArrivedAt: Date;
    completedAt: Date;
}>;
export declare class SlaService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrPatchSlaRecord(bookingId: string, patch: SlaPatch): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SlaStatus;
        createdAt: Date;
        updatedAt: Date;
        bookingId: string;
        breachReason: string | null;
    }>;
    getSla(bookingId: string): Promise<{
        record: {
            id: string;
            status: import(".prisma/client").$Enums.SlaStatus;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            breachReason: string | null;
        };
        metrics: {
            acceptDelayMs: number | null;
            arrivalDelayMs: number | null;
            totalJobMs: number | null;
        };
    }>;
}
export {};
