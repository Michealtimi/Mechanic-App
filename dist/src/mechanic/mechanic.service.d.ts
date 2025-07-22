import { CreatemechanicService } from './dto/create-mechanic-service.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
export declare class MechanicService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMechanicProfile(id: string): Promise<{
        email: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    updateMechanicProfile(dto: UpdateMechanicDto, id: string): Promise<{
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
    saveCertification(id: string, filename: string): Promise<{
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
    uploadProfilePicture(id: string, file: Express.Multer.File): Promise<{
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
    createService(dto: CreatemechanicService, mechanicId: string): Promise<{
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
    getallMechanicservice(id: string): Promise<{
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
    UpdateMechanicService(dto: CreatemechanicService, id: string, mechanicId: string): Promise<{
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
    DeleteMechanicService(id: string, mechanicId: string): Promise<{
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
