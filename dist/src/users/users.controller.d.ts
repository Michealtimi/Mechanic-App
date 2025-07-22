import { UsersService } from './users.service';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    getAdminData(): {
        message: string;
    };
    getUsers(): Promise<{
        email: string;
        id: string;
    }[]>;
    createMechanciAsAdmin(dto: CreateUserDto): Promise<{
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
}
