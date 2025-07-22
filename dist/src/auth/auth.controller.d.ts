import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signupCustomer(dto: AuthDto, res: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    signupMechanic(dto: AuthDto, res: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    signout(res: any, req: any): Promise<import("express").Response<any, Record<string, any>>>;
    signin(dto: AuthDto, res: any, req: any): Promise<import("express").Response<any, Record<string, any>>>;
}
