// src/users/users.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/utils/mail.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  // 💡 INJECT THE MAIL SERVICE INTO THE CONSTRUCTOR
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Centralized user creation logic.
   * This is a core method that handles all user creation (customer, mechanic, and admin).
   * 💡 Refactored to reduce code duplication and centralize validation.
   * 💡 `callerId` and `callerRole` are added for RBAC and audit logging.
   */
  private async createAndLogUser(
    dto: CreateUserDto,
    callerId: string | null = null,
    callerRole: Role | null = null,
  ) {
    // 💡 LOG: Log the DTO received
    console.log('Received DTO for user creation:', dto);

    // 💡 RBAC check: Only admins can create other roles.
    if (callerRole && callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
      this.logger.warn(`Forbidden action: User with role ${callerRole} attempted to create a user.`);
      throw new ForbiddenException('You do not have permission to create users.');
    }

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    // 💡 Increased bcrypt salt rounds for better security.
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // 💡 FIX: Explicitly construct the `data` object to satisfy Prisma's strict typing.
    // This is the key change to fix the TypeScript error.
    const data: any = {
      email: email,
      password: hashedPassword,
      role: dto.role,
    };

    if (dto.role === Role.MECHANIC) {
      data.shopName = dto.shopName;
      data.skills = dto.skills;
      data.status = 'PENDING';
    }

    // 💡 LOG: Log the final data object before passing it to Prisma
    console.log('Data object being sent to Prisma:', data);

    const user = await this.prisma.user.create({
      data,
    });

    // 💡 Added audit log for every user creation.
    await this.prisma.auditLog.create({
      data: {
        userId: callerId, // `null` if public signup.
        action: 'CREATE_USER',
        resource: 'User',
        resourceId: user.id,
        changes: { created: { email: user.email, role: user.role } },
      },
    });

    // 💡 LOG: Log the created user object
    console.log('Successfully created user:', user);

    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  // ---

  /**
   * Public signup for customers.
   * 💡 Simplified to use the private, central `createAndLogUser` method.
   */
  async signupCustomer(dto: SignupCustomerDto) {
    try {
      const newUserDto: CreateUserDto = {
        email: dto.email,
        password: dto.password,
        role: Role.CUSTOMER,
      };

      // 💡 LOG: Log the new DTO created for a customer
      console.log('Customer DTO to be processed:', newUserDto);
      
      const user = await this.createAndLogUser(newUserDto);

      // 💡 CALL THE MAIL SERVICE: Send welcome email to the new customer
      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.fullName, // Assuming you have a fullName field now
        role: user.role,
        password: newUserDto.password, // Optional: send temporary password if the flow requires it
      });

      return { success: true, message: 'Customer signup successful', data: user };
    } catch (error) {
      this.logger.error(`Customer signup failed: ${error.message}`);
      throw new InternalServerErrorException(error.message || 'Customer signup failed');
    }
  }

  // ---

  /**
   * Public signup for mechanics.
   * 💡 Simplified to use the private, central `createAndLogUser` method.
   */
  async signupMechanic(dto: SignupMechanicDto) {
    try {
      const newUserDto: CreateUserDto = {
        email: dto.email,
        password: dto.password,
        role: Role.MECHANIC,
        shopName: dto.shopName,
        skills: dto.skills,
      };

      // 💡 LOG: Log the new DTO created for a mechanic
      console.log('Mechanic DTO to be processed:', newUserDto);
      
      const user = await this.createAndLogUser(newUserDto);

      // 💡 CALL THE MAIL SERVICE: Send welcome email to the new mechanic
      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.fullName,
        role: user.role,
        password: newUserDto.password,
      });

      return { success: true, message: 'Mechanic signup successful', data: user };
    } catch (error) {
      this.logger.error(`Mechanic signup failed: ${error.message}`);
      throw new InternalServerErrorException(error.message || 'Mechanic signup failed');
    }
  }

  // ---

  /**
   * Create user by an admin.
   * 💡 This endpoint is now strictly for admins and uses the centralized logic.
   */
  async createUser(dto: CreateUserDto, callerId: string, callerRole: Role) {
    try {
      // 💡 LOG: Log the DTO received from the admin request
      console.log('Admin user creation DTO:', dto);
      
      const user = await this.createAndLogUser(dto, callerId, callerRole);
      
      // 💡 CALL THE MAIL SERVICE: Send welcome email to the user created by an admin
      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.fullName,
        role: user.role,
        password: dto.password, // Send the temporary password
      });

      return { success: true, message: 'User created', data: user };
    } catch (error) {
      this.logger.error(`Admin user creation failed: ${error.message}`);
      throw new InternalServerErrorException(error.message || 'Create user failed');
    }
  }

  // ---

  /**
   * Get all users with enhanced filtering and pagination.
   * 💡 Added optional filters for role and a search query (`q`).
   */
  async getAllUsers(page = 1, limit = 10, filters?: { role?: Role; q?: string }) {
    try {
      // 💡 LOG: Log the filters being used for the query
      console.log('Fetching users with filters:', filters);

      const take = Math.min(Math.max(1, limit), 100);
      const skip = Math.max(0, (page - 1) * take);
      const where: any = { deletedAt: null };

      // 💡 Added advanced filtering logic.
      if (filters?.role) where.role = filters.role;
      if (filters?.q) {
        where.OR = [
          { email: { contains: filters.q, mode: 'insensitive' } },
          { shopName: { contains: filters.q, mode: 'insensitive' } },
        ];
      }
      
      // 💡 LOG: Log the final Prisma query `where` clause
      console.log('Prisma `where` clause for getAllUsers:', where);

      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({ where, take, skip }),
        this.prisma.user.count({ where }),
      ]);

      if (!users.length) {
        throw new NotFoundException('No users found');
      }

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true }),
          pagination: {
            page,
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw new InternalServerErrorException(error.message || 'Error fetching users');
    }
  }

  // ---

  /**
   * Get single user by ID.
   * 💡 Error handling now throws a specific `NotFoundException`.
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      message: 'User retrieved',
      data: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  // ---

  /**
   * Update user.
   * 💡 Added RBAC checks to prevent unauthorized updates.
   * 💡 Added audit logging for update actions.
   */
  async updateUser(id: string, dto: UpdateUserDto, callerId: string, callerRole: Role) {
    // 💡 RBAC check: User can only update their own profile unless they are an admin.
    if (callerId !== id && callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
      throw new ForbiddenException('Insufficient permissions to update this user');
    }
    
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    
    const updateData: any = {
      ...dto,
      ...(dto.email && { email: dto.email.toLowerCase() }),
      ...(dto.fullName && { fullName: dto.fullName.toUpperCase() }),
    };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12); // 💡 Stronger hash.
    }

    const updated = await this.prisma.user.update({ where: { id }, data: updateData });

    // 💡 Added audit log.
    await this.prisma.auditLog.create({
      data: {
        userId: callerId,
        action: 'UPDATE_USER',
        resource: 'User',
        resourceId: id,
        changes: dto as any,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: plainToInstance(UserResponseDto, updated, { excludeExtraneousValues: true }),
    };
  }

  // ---

  /**
   * Soft delete.
   * 💡 Added RBAC checks to ensure only authorized users can delete.
   * 💡 Added audit logging for soft delete actions.
   */
  async deleteUser(id: string, callerId: string, callerRole: Role) {
    // 💡 RBAC check: Only admins can perform this action.
    if (callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
      throw new ForbiddenException('You do not have permission to delete users');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const deleted = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 💡 Added audit log.
    await this.prisma.auditLog.create({
      data: {
        userId: callerId,
        action: 'SOFT_DELETE_USER',
        resource: 'User',
        resourceId: id,
        changes: { previousDeletedAt: existing.deletedAt, newDeletedAt: deleted.deletedAt },
      },
    });

    return {
      success: true,
      message: 'User deleted successfully',
      data: plainToInstance(UserResponseDto, deleted, { excludeExtraneousValues: true }),
    };
  }
}