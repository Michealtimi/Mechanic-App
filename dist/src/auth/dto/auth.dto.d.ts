import { Role } from '@prisma/client';
export declare enum MechanicStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class RegisterUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    isEvSpecialist?: boolean;
    serviceRadiusKm?: number;
    bio?: string;
    specializations?: string[];
    profilePictureUrl?: string;
    status?: MechanicStatus;
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
