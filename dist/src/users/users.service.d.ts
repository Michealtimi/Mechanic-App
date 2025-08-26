import { PrismaService } from 'prisma/prisma.service';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    signupCustomer(dto: SignupCustomerDto): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    signupMechanic(dto: SignupMechanicDto): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    createUser(dto: CreateUserDto): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    getAllUsers(page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            users: UserResponseDto[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getUserById(id: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    updateUser(id: string, dto: UpdateUserDto): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
}
