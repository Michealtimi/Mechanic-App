import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto, LoginDto, RegisterUserDto, ResetPasswordDto } from './dto/auth.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { MailService } from 'src/utils/mail.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    private readonly mailService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService, mailService: MailService);
    register(dto: RegisterUserDto): Promise<any>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        success: boolean;
        message: string;
        user: UserResponseDto;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private hashPassword;
    private comparePassword;
    private getTokensAndStoreRefresh;
    private parseDurationToMs;
}
