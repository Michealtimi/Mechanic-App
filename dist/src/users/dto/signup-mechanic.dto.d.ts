import { Role } from '@prisma/client';
export declare class SignupMechanicDto {
    email: string;
    password: string;
    shopName?: string;
    skills?: string[];
    readonly role: Role;
}
