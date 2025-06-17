import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: AuthDto): Promise<{
        success: boolean;
        messalge: string;
        data: {
            email: string;
            password: string;
            id: string;
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
    signin(dto: AuthDto, res: any, req: any): Promise<import("express").Response<any, Record<string, any>>>;
    signout(res: any, req: any): Promise<import("express").Response<any, Record<string, any>>>;
}
