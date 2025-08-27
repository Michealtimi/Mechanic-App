import { PrismaService } from 'prisma/prisma.service';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { MechanicProfileResponseDto } from './dto/mechanic-profile--response.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
export declare class MechanicService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMechanicProfile(id: string): Promise<{
        success: boolean;
        message: string;
        data: MechanicProfileResponseDto;
    }>;
    updateMechanicProfile(id: string, dto: UpdateMechanicDto): Promise<{
        success: boolean;
        message: string;
        data: MechanicProfileResponseDto;
    }>;
    saveCertification(id: string, filename: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    uploadProfilePicture(id: string, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: MechanicProfileResponseDto;
    }>;
    createService(mechanicId: string, dto: CreateMechanicServiceDto): Promise<{
        success: boolean;
        message: string;
        data: ServiceResponseDto;
    }>;
    getAllMechanicServices(mechanicId: string): Promise<{
        success: boolean;
        message: string;
        data: ServiceResponseDto;
    }>;
    updateMechanicService(id: string, mechanicId: string, dto: UpdateServiceDto): Promise<{
        success: boolean;
        message: string;
        data: ServiceResponseDto;
    }>;
    deleteMechanicService(id: string, mechanicId: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
