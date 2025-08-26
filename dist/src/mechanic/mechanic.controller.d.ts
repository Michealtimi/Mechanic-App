import { MechanicService } from './mechanic.service';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { MechanicProfileResponseDto } from './dto/mechanic-profile--response.dto';
export declare class MechanicController {
    private readonly mechanicService;
    constructor(mechanicService: MechanicService);
    getProfile(req: any): Promise<{
        success: boolean;
        message: string;
        data: MechanicProfileResponseDto;
    }>;
    updateProfile(req: any, dto: UpdateMechanicDto): Promise<{
        success: boolean;
        message: string;
        data: MechanicProfileResponseDto;
    }>;
    uploadCertification(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: string[];
    }>;
    uploadProfilePicture(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: MechanicProfileResponseDto;
    }>;
    createService(req: any, dto: CreateMechanicServiceDto): Promise<{
        success: boolean;
        message: string;
        data: ServiceResponseDto;
    }>;
    getServices(req: any): Promise<{
        success: boolean;
        message: string;
        data: ServiceResponseDto[];
    }>;
    updateService(req: any, dto: UpdateServiceDto, id: string): Promise<{
        success: boolean;
        message: string;
        data: ServiceResponseDto;
    }>;
    deleteService(req: any, id: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
