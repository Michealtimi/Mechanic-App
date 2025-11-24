import { MechanicService } from './mechanic.service';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { Role } from '@prisma/client';
export declare class MechanicController {
    private readonly mechanicService;
    constructor(mechanicService: MechanicService);
    getMechanicProfile(id: string, callerRole: Role): Promise<any>;
    updateMechanicProfile(callerId: string, dto: UpdateMechanicDto): Promise<any>;
    saveCertification(callerId: string, file: Express.Multer.File): Promise<any>;
    uploadProfilePicture(callerId: string, file: Express.Multer.File): Promise<any>;
    createService(callerId: string, dto: CreateMechanicServiceDto): Promise<any>;
    getAllMechanicServices(callerId: string, callerRole: Role): Promise<any>;
    updateMechanicService(serviceId: string, callerId: string, dto: UpdateServiceDto): Promise<any>;
    deleteMechanicService(serviceId: string, callerId: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
