import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dispatch.dto';
import { User } from '@prisma/client';
declare class RejectDispatchDto {
    reason?: string;
}
export declare class DispatchController {
    private readonly dispatchService;
    constructor(dispatchService: DispatchService);
    create(req: User, dto: CreateDispatchDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DispatchStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string | null;
        bookingId: string;
    }>;
    accept(req: UserRequest, id: string): Promise<any>;
    reject(req: UserRequest, id: string, body: RejectDispatchDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DispatchStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string | null;
        bookingId: string;
    }>;
}
export {};
