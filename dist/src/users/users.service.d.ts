import { PrismaService } from 'prisma/prisma.service';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/utils/mail.service';
export declare class UsersService {
    private readonly prisma;
    private readonly mailService;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService);
    private createAndLogUser;
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
    createUser(dto: CreateUserDto, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    getAllUsers(page?: number, limit?: number, filters?: {
        role?: string;
        q?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            users: UserResponseDto;
            pagination: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    getUserById(id: string, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    updateUser(id: string, dto: UpdateUserDto, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
    deleteUser(id: string, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponseDto;
    }>;
}
