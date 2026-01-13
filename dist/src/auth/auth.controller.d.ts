import { AuthService } from './auth.service';
import { RegisterUserDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterUserDto): Promise<unknown>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        success: boolean;
        message: string;
        user: unknown;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
