import { Request } from 'express';
import { CreateMechanicDto } from 'src/mechanic/dto/mechanic.dto';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyUser(id: string, req: Request): Promise<{
        email: string;
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
    createMechanic(dto: CreateMechanicDto): Promise<{
        email: string;
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
    getUsers(): Promise<{
        email: string;
        id: string;
    }[]>;
    createUserWithRole(dto: CreateUserDto): Promise<{
        email: string;
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
    private hashPassword;
    private normalizeSkills;
}
