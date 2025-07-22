import { PrismaService } from 'prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    signupCusmtomer(dto: AuthDto): Promise<{
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
    signupMechanic(dto: AuthDto): Promise<{
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
    signin(dto: AuthDto, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    signout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    hashPassword(password: string): Promise<any>;
    comparePassword(args: {
        password: string;
        hashedPassword: string;
    }): Promise<any>;
    signToken(args: {
        id: string;
        email: string;
        role: Role;
    }): Promise<string>;
    role(): Promise<void>;
}
