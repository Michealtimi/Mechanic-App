import { Role } from '@prisma/client';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'prisma/prisma.service';
export declare class MechanicService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
    updateMechanicProfile(id: string, dto: UpdateMechanicDto, callerId: string): Promise<{
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
    uploadProfilePicture(id: string, filename: string, callerId: string): Promise<{
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
    saveCertification(id: string, filename: string, callerId: string): Promise<string[]>;
    createService(mechanicId: string, dto: CreateMechanicServiceDto, callerId: string): Promise<{
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
    getAllMechanicServices(mechanicId: string, callerId: string, callerRole: Role): Promise<{
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
    updateMechanicService(id: string, mechanicId: string, dto: UpdateServiceDto): Promise<{
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
    deleteMechanicService(id: string, mechanicId: string): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
