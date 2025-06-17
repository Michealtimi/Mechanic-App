import { UsersService } from './users.service';
import { Request } from 'express';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    getAdminData(): {
        message: string;
    };
    getUsers(): Promise<{
        id: string;
        email: string;
    }[]>;
}
