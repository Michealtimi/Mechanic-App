import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    signup(dto: AuthDto, role: Role, status?: 'ACTIVE' | 'PENDING'): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    signin(dto: AuthDto): Promise<{
        success: boolean;
        message: string;
        token: string;
        user: UserResponseDto;
    }>;
    private hashPassword;
    private comparePassword;
    private signToken;
}
