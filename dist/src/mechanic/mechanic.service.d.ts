import { Role } from '@prisma/client';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'prisma/prisma.service';
export declare class MechanicService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getMechanicProfile(id: string, callerRole: Role): Promise<any>;
    updateMechanicProfile(id: string, dto: UpdateMechanicDto, callerId: string): Promise<any>;
    uploadProfilePicture(id: string, filename: string, callerId: string): Promise<any>;
    saveCertification(id: string, filename: string, callerId: string): Promise<any>;
    createService(mechanicId: string, dto: CreateMechanicServiceDto, callerId: string): Promise<any>;
    getAllMechanicServices(mechanicId: string, callerId: string, callerRole: Role): Promise<any>;
    updateMechanicService(id: string, mechanicId: string, dto: UpdateServiceDto): Promise<any>;
    deleteMechanicService(id: string, mechanicId: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
