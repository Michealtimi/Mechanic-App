import { CreatemechanicService } from './dto/create-mechanic-service.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
export declare class MechanicService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMechanicProfile(id: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    updateMechanicProfile(dto: UpdateMechanicDto, id: string): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
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
    saveCertification(id: string, filename: string): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
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
    uploadProfilePicture(id: string, file: Express.Multer.File): Promise<{
        id: string;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
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
    createService(dto: CreatemechanicService, mechanicId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }>;
    getallMechanicservice(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }[]>;
    UpdateMechanicService(dto: CreatemechanicService, id: string, mechanicId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }>;
    DeleteMechanicService(id: string, mechanicId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        price: number;
        estimatedTime: string | null;
        availability: string | null;
        mechanicId: string;
    }>;
}
