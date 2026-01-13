import { SlaService } from './sla.service';
export declare class SlaController {
    private readonly sla;
    constructor(sla: SlaService);
    upsert(bookingId: string, body: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SlaStatus;
        createdAt: Date;
        updatedAt: Date;
        bookingId: string;
        breachReason: string | null;
    }>;
    get(bookingId: string): Promise<{
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
