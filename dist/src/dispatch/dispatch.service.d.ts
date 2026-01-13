import { PrismaService } from 'prisma/prisma.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { NotificationGateway } from 'src/notification/notification.gateway';
export declare class DispatchService {
    private readonly prisma;
    private readonly notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationGateway: NotificationGateway);
    createDispatch(dto: CreateDispatchDto, createdBy: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DispatchStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string | null;
        bookingId: string;
    }>;
    acceptDispatch(dispatchId: string, mechanicId: string): Promise<any>;
    rejectDispatch(dispatchId: string, mechanicId: string, reason?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DispatchStatus;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string | null;
        bookingId: string;
    }>;
}
