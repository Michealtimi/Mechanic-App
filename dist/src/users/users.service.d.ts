import { PrismaService } from 'prisma/prisma.service';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MechanicUpdateProfileDto } from './dto/mechanic-update-profile.dto';
import { Role, Status } from '@prisma/client';
import { MailService } from 'src/utils/mail.service';
import { AuditService } from '../audit/audit.service';
export declare class UsersService {
    private readonly prisma;
    private readonly mailService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService, auditService: AuditService);
    getUserContactDetails(userId: string): Promise<{
        email: string;
        phoneNumber: string | null;
    } | null>;
    private createAndLogUser;
    signupCustomer(dto: SignupCustomerDto): Promise<{
        success: boolean;
        message: string;
        data: unknown;
    }>;
    signupMechanic(dto: SignupMechanicDto): Promise<{
        success: boolean;
        message: string;
        data: unknown;
    }>;
    createUser(dto: CreateUserDto, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: unknown;
    }>;
    getAllUsers(page?: number, limit?: number, filters?: {
        role?: Role;
        q?: string;
        status?: Status;
        isEvSpecialist?: boolean;
        isAvailableForJobs?: boolean;
        minRating?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            users: unknown[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    getUserById(id: string, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: unknown[];
    }>;
    updateUser(id: string, dto: UpdateUserDto | MechanicUpdateProfileDto, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: unknown;
    }>;
    deleteUser(id: string, callerId: string, callerRole: string): Promise<{
        success: boolean;
        message: string;
        data: unknown;
    }>;
}
