export declare class AuthDto {
    email: string;
    password: string;
}
export declare class RegisterUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
