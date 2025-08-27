import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    signup(dto: AuthDto, role: Role, status?: 'ACTIVE' | 'PENDING'): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    signin(dto: AuthDto): Promise<{
        user: UserResponseDto;
        accessToken: string;
        refreshToken: string;
        success: boolean;
        message: string;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
        token?: undefined;
    } | {
        message: string;
        token: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private hashPassword;
    private comparePassword;
    private getTokensAndStoreRefresh;
    private parseDurationToMs;
}
