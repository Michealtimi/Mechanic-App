import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signupCustomer(dto: AuthDto): Promise<{
        success: boolean;
        message: string;
        data: import("../users/dto/user-response.dto").UserResponseDto;
    }>;
    signupMechanic(dto: AuthDto): Promise<{
        success: boolean;
        message: string;
        data: import("../users/dto/user-response.dto").UserResponseDto;
    }>;
    signin(dto: AuthDto): Promise<{
        success: boolean;
        message: string;
        token: string;
        user: import("../users/dto/user-response.dto").UserResponseDto;
    }>;
    signupAdmin(dto: AuthDto): Promise<{
        success: boolean;
        message: string;
        data: import("../users/dto/user-response.dto").UserResponseDto;
    }>;
}
