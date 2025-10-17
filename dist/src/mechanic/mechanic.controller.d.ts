import { MechanicService } from './mechanic.service';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { Role } from '@prisma/client';
export declare class MechanicController {
    private readonly mechanicService;
    constructor(mechanicService: MechanicService);
    getMechanicProfile(id: string, callerRole: Role): Promise<{
        skills: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.Status;
        shopName: string | null;
        location: string | null;
        createdAt: Date;
        updatedAt: Date;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
        deletedAt: Date | null;
        lastLogin: Date | null;
    }>;
    updateMechanicProfile(callerId: string, dto: UpdateMechanicDto): Promise<{
        skills: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.Status;
        shopName: string | null;
        location: string | null;
        createdAt: Date;
        updatedAt: Date;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
        deletedAt: Date | null;
        lastLogin: Date | null;
    }>;
    saveCertification(callerId: string, file: Express.Multer.File): Promise<string[]>;
    uploadProfilePicture(callerId: string, file: Express.Multer.File): Promise<{
        id: string;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: import(".prisma/client").$Enums.Status;
        shopName: string | null;
        location: string | null;
        createdAt: Date;
        updatedAt: Date;
        experienceYears: number | null;
        profilePictureUrl: string | null;
        bio: string | null;
        certificationUrls: string[];
        deletedAt: Date | null;
        lastLogin: Date | null;
    }>;
    createService(callerId: string, dto: CreateMechanicServiceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        mechanicId: string;
        estimatedTime: string | null;
        availability: string | null;
    }>;
    getAllMechanicServices(callerId: string, callerRole: Role): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        mechanicId: string;
        estimatedTime: string | null;
        availability: string | null;
    }[]>;
    updateMechanicService(serviceId: string, callerId: string, dto: UpdateServiceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        price: number;
        mechanicId: string;
        estimatedTime: string | null;
        availability: string | null;
    }>;
    deleteMechanicService(serviceId: string, callerId: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
