import { MechanicService } from './mechanic.service';
import { CreatemechanicService } from './dto/create-mechanic-service.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
export declare class MechanicController {
    private readonly mechanicService;
    constructor(mechanicService: MechanicService);
    getMechanicProfile(req: Request & {
        user: {
            id: string;
        };
    }): Promise<{
        email: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    updateMechanicProfile(req: Request & {
        user: {
            id: string;
        };
    }, dto: UpdateMechanicDto): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        status: string;
        shopName: string | null;
        location: string | null;
        skills: string[];
        createdAt: Date;
        updatedAt: Date;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
    }>;
    uploadCertification(file: Express.Multer.File, req: any): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        status: string;
        shopName: string | null;
        location: string | null;
        skills: string[];
        createdAt: Date;
        updatedAt: Date;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
    }>;
    uploadProfilePicture(file: Express.Multer.File, req: any): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        status: string;
        shopName: string | null;
        location: string | null;
        skills: string[];
        createdAt: Date;
        updatedAt: Date;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
    }>;
    createMechanicService(req: any, dto: CreatemechanicService): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }>;
    getAllMechanicServices(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }[]>;
    updateService(req: any, dto: CreatemechanicService, serviceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }>;
    deleteService(req: any, serviceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }>;
}
