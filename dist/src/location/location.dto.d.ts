import { Role } from '@prisma/client';
export declare class UpdateLocationDto {
    lat: number;
    lng: number;
}
export declare class GetNearbyMechanicsDto {
    lat: number;
    lng: number;
    radiusKm?: number;
}
export declare class MechanicGeoResponseDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    lat?: number;
    lng?: number;
    isEvSpecialist: boolean;
    serviceRadiusKm: number;
    bio: string;
    specializations: string[];
    profilePictureUrl?: string;
    distance?: number;
}
