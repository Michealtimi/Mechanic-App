import { Role, Status } from '@prisma/client';
export declare class UpdateUserDto {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    pushToken?: string;
    status?: Status;
    role?: Role;
    bio?: string;
    profilePictureUrl?: string;
    certificationUrls?: string[];
}
