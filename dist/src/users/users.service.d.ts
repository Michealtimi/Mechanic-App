import { Request } from 'express';
import { CreateMechanicDto } from 'src/mechanic/dto/mechanic.dto';
import { PrismaService } from 'prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyUser(id: string, req: Request): Promise<{
        user: {
            id: string;
            email: string;
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
        };
    }>;
    createMechanic(dto: CreateMechanicDto): Promise<{
        id: string;
        email: string;
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
    getUsers(): Promise<{
        id: string;
        email: string;
    }[]>;
    private hashPassword;
}
