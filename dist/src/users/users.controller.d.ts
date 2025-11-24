import { UsersService } from './users.service';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    signupCustomer(dto: SignupCustomerDto): Promise<{
        success: boolean;
        message: string;
        data: import("./dto/user-response.dto").UserResponseDto;
    }>;
    signupMechanic(dto: SignupMechanicDto): Promise<{
        success: boolean;
        message: string;
        data: import("./dto/user-response.dto").UserResponseDto;
    }>;
    createUser(dto: CreateUserDto, callerId: string, callerRole: Role): Promise<{
        success: boolean;
        message: string;
        data: import("./dto/user-response.dto").UserResponseDto;
    }>;
    getAllUsers(page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            users: import("./dto/user-response.dto").UserResponseDto;
            pagination: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    getUserById(id: string, callerId: string, callerRole: Role): Promise<{
        success: boolean;
        message: string;
        data: import("./dto/user-response.dto").UserResponseDto;
    }>;
    updateUser(id: string, dto: UpdateUserDto, callerId: string, callerRole: Role): Promise<{
        success: boolean;
        message: string;
        data: import("./dto/user-response.dto").UserResponseDto;
    }>;
    deleteUser(id: string, callerId: string, callerRole: Role): Promise<{
        success: boolean;
        message: string;
        data: import("./dto/user-response.dto").UserResponseDto;
    }>;
}
