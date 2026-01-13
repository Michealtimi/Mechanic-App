import { Role } from '@prisma/client';
export declare class SignupMechanicDto extends CreateUserDto {
    shopName: string;
    skills?: string[];
    experienceYears?: number;
    isEvSpecialist?: boolean;
    serviceRadiusKm?: number;
    currentLat?: number;
    currentLng?: number;
    bio?: string;
    profilePictureUrl?: string;
    certificationUrls?: string[];
}
export declare class CreateUserDto {
    email: string;
    password: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    pushToken?: string;
}
