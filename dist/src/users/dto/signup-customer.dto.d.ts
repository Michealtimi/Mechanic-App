import { Role } from '@prisma/client';
export declare class SignupCustomerDto {
    email: string;
    password: string;
    readonly role: Role;
}
