import { AuthService } from './auth.service';
import { RegisterUserDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterUserDto): Promise<{
        success: boolean;
        message: string;
        data: import("../users/dto/user-response.dto").UserResponseDto;
    }>;
    login(dto: LoginDto): Promise<{
        user: import("../users/dto/user-response.dto").UserResponseDto;
        accessToken: string;
        refreshToken: string;
        success: boolean;
        message: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        token?: undefined;
    } | {
        message: string;
        token: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
