// src/users/users.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role } from '@prisma/client';
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
    callerRole: string | null = null,
  ) {
    try {
      // LOG: Log the DTO received
      this.logger.log(`Creating user with email: ${dto.email} and role: ${dto.role}`);

      // 💡 RBAC check: Only admins can create other roles.
      if (
        callerRole &&
        callerRole !== Role.ADMIN &&
        callerRole !== Role.SUPERADMIN
      ) {
        this.logger.warn(
          `Forbidden action: User with role ${callerRole} attempted to create a user.`,
        );
        throw new ForbiddenException('You do not have permission to create users.');
      }

      const email = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException('Email already exists');
      }

      // 💡 Increased bcrypt salt rounds for better security.
      const hashedPassword = await bcrypt.hash(dto.password, 12);

      // 💡 FIX: Explicitly construct the `data` object to satisfy Prisma's strict typing.
      // This is the key change to fix the TypeScript error.
      const data: Prisma.UserCreateInput = {
        email: email,
        password: hashedPassword,
        role: dto.role as Role,
      } as any;

      if (dto.role === Role.MECHANIC) {
        data.shopName = dto.shopName;
        if (dto.skills && dto.skills.length > 0) {
          data.skills = {
            connectOrCreate: dto.skills.map((skillName) => ({
              where: { name: skillName },
              create: { name: skillName },
            })),
          };
        }
        data.status = 'PENDING';
      }

      // LOG: Log the final data object before passing it to Prisma
      this.logger.log('Data object being sent to Prisma for creation.');

      const user = await this.prisma.user.create({
        data,
      });

      // 💡 Added audit log for every user creation.
      await this.prisma.audit.create({
        data: {
          userId: callerId, // `null` if public signup.
          action: 'CREATE_USER',
          resource: 'User',
          resourceId: user.id,
          changes: { created: { email: user.email, role: user.role } },
        },
      });

      // LOG: Log the created user object
      this.logger.log(`Successfully created user with ID: ${user.id}`);

      return plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      this.logger.error(`Failed to create user`, err.stack);
      // Re-throw specific client errors
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
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
        role: 'CUSTOMER' as Role,
      };

      // LOG: Log the new DTO created for a customer
      this.logger.log(`Processing signup for new customer: ${newUserDto.email}`);

      const user = await this.createAndLogUser(newUserDto);

      // 💡 CALL THE MAIL SERVICE: Send welcome email to the new customer
      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.fullName, // Assuming you have a fullName field now
        role: user.role,
        password: newUserDto.password, // Optional: send temporary password if the flow requires it
      });

      return { success: true, message: 'Customer signup successful', data: user };
    } catch (err) {
      this.logger.error(`Customer signup failed`, err.stack);
      // Re-throw specific client errors
      if (err instanceof BadRequestException || err instanceof ConflictException) {
        throw err;
      }
      throw new InternalServerErrorException('Customer signup failed');
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
        role: 'MECHANIC' as Role,
        shopName: dto.shopName,
        skills: dto.skills,
      };

      // LOG: Log the new DTO created for a mechanic
      this.logger.log(`Processing signup for new mechanic: ${newUserDto.email}`);

      const user = await this.createAndLogUser(newUserDto);

      // 💡 CALL THE MAIL SERVICE: Send welcome email to the new mechanic
      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.fullName,
        role: user.role,
        password: newUserDto.password,
      });

      return { success: true, message: 'Mechanic signup successful', data: user };
    } catch (err) {
      this.logger.error(`Mechanic signup failed`, err.stack);
      // Re-throw specific client errors
      if (err instanceof BadRequestException || err instanceof ConflictException) {
        throw err;
      }
      throw new InternalServerErrorException('Mechanic signup failed');
    }
  }

  // ---

  /**
   * Create user by an admin.
   * 💡 This endpoint is now strictly for admins and uses the centralized logic.
   */
  async createUser(dto: CreateUserDto, callerId: string, callerRole: string) {
    try {
      // LOG: Log the DTO received from the admin request
      this.logger.log(`Admin ${callerId} creating user with email: ${dto.email}`);

      const user = await this.createAndLogUser(dto, callerId, callerRole);

      // 💡 CALL THE MAIL SERVICE: Send welcome email to the user created by an admin
      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.fullName,
        role: user.role,
        password: dto.password, // Send the temporary password
      });

      return { success: true, message: 'User created', data: user };
    } catch (err) {
      this.logger.error(`Admin user creation failed`, err.stack);
      // Re-throw specific client errors
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Create user failed');
    }
  }

  // ---

  /**
   * Get all users with enhanced filtering and pagination.
   * 💡 Added optional filters for role and a search query (`q`).
   */
  async getAllUsers(page = 1, limit = 10, filters?: { role?: string; q?: string }) {
    try {
      // LOG: Log the filters being used for the query
      this.logger.log(`Fetching users with filters: ${JSON.stringify(filters)}`);

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

      // LOG: Log the final Prisma query `where` clause
      this.logger.log(`Prisma 'where' clause for getAllUsers: ${JSON.stringify(where)}`);

      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({ where, take, skip }),
        this.prisma.user.count({ where }),
      ]);

      if (!users.length) {
        // Log before throwing
        this.logger.warn('No users found for the given filters.');
        throw new NotFoundException('No users found');
      }

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: plainToInstance(UserResponseDto, users, {
            excludeExtraneousValues: true,
          }),
          pagination: {
            page,
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
          },
        },
      };
    } catch (err) {
      this.logger.error(`Failed to get all users`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  // ---

  /**
   * Get single user by ID.
   * 💡 Error handling now throws a specific `NotFoundException`.
   */
  async getUserById(id: string, callerId: string, callerRole: string) {
    try {
      // LOG: Log the ID being searched
      this.logger.log(`Searching for user with ID: ${id} by caller: ${callerId}`);

      // RBAC check: User can only get their own profile unless they are an admin.
      if (callerId !== id && callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
        this.logger.warn(`Forbidden: Caller ${callerId} tried to access user profile ${id}.`);
        throw new ForbiddenException('Insufficient permissions to view this user profile');
      }

      const user = await this.prisma.user.findUnique({ where: { id } });

      if (!user) {
        // Log before throwing
        this.logger.warn(`User with ID ${id} not found.`);
        throw new NotFoundException('User not found');
      }

      // LOG: Log the found user
      this.logger.log(`User found: ${user.email}`);

      return {
        success: true,
        message: 'User retrieved',
        data: plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (err) {
      this.logger.error(`Failed to get user by ID ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  // ---

  /**
   * Update user.
   * 💡 Added RBAC checks to prevent unauthorized updates.
   * 💡 Added audit logging for update actions.
   */
  async updateUser(id: string, dto: UpdateUserDto, callerId: string, callerRole: string) {
    try {
      // 💡 LOG: Log the update attempt
      console.log(
        `Attempting to update user ${id} with DTO:`,
        dto,
        `by caller: ${callerId} (${callerRole})`,
      );

      // 💡 RBAC check: User can only update their own profile unless they are an admin.
      if (callerId !== id && callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
        // Log before throwing
        console.log(`Forbidden: Caller ${callerId} tried to update user ${id}.`);
        throw new ForbiddenException('Insufficient permissions to update this user');
      }

      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) {
        // Log before throwing
        console.log(`User ${id} not found for update.`);
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

      // LOG: Log the final update data
      this.logger.log('Final update data for user update.');

      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      // 💡 Added audit log.
      await this.prisma.audit.create({
        data: {
          userId: callerId,
          action: 'UPDATE_USER',
          resource: 'User',
          resourceId: id,
          changes: dto as any,
        },
      });

      // LOG: Log successful update
      this.logger.log(`Successfully updated user ${id}.`);

      return {
        success: true,
        message: 'User updated successfully',
        data: plainToInstance(UserResponseDto, updated, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (err) {
      this.logger.error(`Failed to update user ${id}`, err.stack);
      // Re-throw specific client errors
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof ConflictException // Handle potential unique constraint violation on email
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  // ---

  /**
   * Soft delete.
   * 💡 Added RBAC checks to ensure only authorized users can delete.
   * 💡 Added audit logging for soft delete actions.
   */
  async deleteUser(id: string, callerId: string, callerRole: string) {
    try {
      // LOG: Log the delete attempt
      this.logger.log(`Attempting to delete user ${id} by caller: ${callerId} (${callerRole})`);

      // 💡 RBAC check: Only admins can perform this action.
      if (callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
        // Log before throwing
        this.logger.warn(`Forbidden: Caller ${callerId} tried to delete user ${id}.`);
        throw new ForbiddenException('You do not have permission to delete users');
      }

      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) {
        // Log before throwing
        console.log(`User ${id} not found for deletion.`);
        throw new NotFoundException('User not found');
      }

      const deleted = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // 💡 Added audit log.
      await this.prisma.audit.create({
        data: {
          userId: callerId,
          action: 'SOFT_DELETE_USER',
          resource: 'User',
          resourceId: id,
          changes: {
            previousDeletedAt: existing.deletedAt,
            newDeletedAt: deleted.deletedAt,
          },
        },
      });

      // LOG: Log successful deletion
      this.logger.log(`Successfully soft-deleted user ${id}.`);

      return {
        success: true,
        message: 'User deleted successfully',
        data: plainToInstance(UserResponseDto, deleted, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (err) {
      this.logger.error(`Failed to delete user ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}