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
// CHANGED/ADDED: Import new/updated DTOs for mechanics
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UserResponseDto } from './dto/createmechanic.dto';
// CHANGED/ADDED: Import updated DTO for user updates, and potentially a specific one for mechanics
import { UpdateUserDto } from './dto/update-user.dto';
// ADDED: Import MechanicUpdateProfileDto for mechanic-specific updates
import { MechanicUpdateProfileDto } from './dto/mechanic-update-profile.dto'; // <-- NEW DTO: Create this file
import { Prisma, Role, Status, MechanicOnlineStatus } from '@prisma/client'; // ADDED: Status and MechanicOnlineStatus enums
import { MailService } from 'src/utils/mail.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * ✅ NEW METHOD: Retrieves essential contact details for a user.
   * This is used by the NotificationService to send emails/SMS.
   * (No changes needed here based on schema update, as fields already existed)
   */
  async getUserContactDetails(userId: string) {
    this.logger.debug(`Fetching contact details for user ID: ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phoneNumber: true,
        // If you implement push notifications, ensure pushToken is also selected
        // pushToken: true,
      },
    });

    if (!user) {
      this.logger.warn(`User with ID ${userId} not found when fetching contact details.`);
      return null;
    }

    this.logger.debug(`Found contact details for user ${userId}: Email=${user.email}, Phone=${user.phoneNumber}`);
    return user;
  }

  /**
   * Centralized user creation logic.
   * This is a core method that handles all user creation (customer, mechanic, and admin).
   * 💡 Refactored to reduce code duplication and centralize validation.
   * 💡 `callerId` and `callerRole` are added for RBAC and audit logging.
   *
   * CHANGED: `dto` type potentially includes new mechanic fields now.
   */
  private async createAndLogUser(
    dto: CreateUserDto | SignupMechanicDto, // CHANGED: Allow SignupMechanicDto here to pass all fields
    callerId: string | null = null,
    callerRole: string | null = null,
  ) {
    try {
      this.logger.log(`Creating user with email: ${dto.email} and role: ${dto.role}`);

      if (
        callerRole &&
        callerRole !== Role.ADMIN &&
        callerRole !== Role.SUPERADMIN &&
        dto.role !== Role.CUSTOMER // Allow non-admins to create CUSTOMERS
      ) {
        this.logger.warn(
          `Forbidden action: User with role ${callerRole} attempted to create a user with role ${dto.role}.`,
        );
        throw new ForbiddenException('You do not have permission to create users of this role.');
      }

      const email = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);

      // 💡 FIX: Explicitly construct the `data` object to satisfy Prisma's strict typing.
      // CHANGED: Added new mechanic-specific fields here with default values
      const data: Prisma.UserCreateInput = {
        email: email,
        password: hashedPassword,
        role: dto.role as Role,
        firstName: dto.firstName, // Assuming firstName/lastName are preferred over fullName
        lastName: dto.lastName,
        // fullName: dto.fullName || email.split('@')[0], // Consider firstName/lastName for better structure
      };

      // Handle properties common to all users but not mandatory
      if (dto.phoneNumber) {
        data.phoneNumber = dto.phoneNumber;
      }
      if (dto.pushToken) {
        data.pushToken = dto.pushToken;
      }

      // -------------------------------------------------------------------
      // CHANGED/ADDED: Mechanic-specific fields for creation
      // This block now includes all new fields for the Mechanic role
      // -------------------------------------------------------------------
      if (dto.role === Role.MECHANIC) {
        const mechanicDto = dto as SignupMechanicDto; // Cast to access mechanic-specific fields safely

        data.shopName = mechanicDto.shopName;
        data.status = Status.PENDING; // NEW: Default status for new mechanics requiring approval
        data.isEvSpecialist = mechanicDto.isEvSpecialist ?? false; // ADDED: Default to false if not provided
        data.serviceRadiusKm = mechanicDto.serviceRadiusKm ?? 20; // ADDED: Default service radius
        data.currentLat = mechanicDto.currentLat; // ADDED: Can be null initially
        data.currentLng = mechanicDto.currentLng; // ADDED: Can be null initially
        data.bio = mechanicDto.bio; // ADDED: Mechanic's bio
        data.profilePictureUrl = mechanicDto.profilePictureUrl; // ADDED: Profile picture URL
        data.certificationUrls = mechanicDto.certificationUrls ?? []; // ADDED: Certification URLs

        // Default aggregated fields (will be updated by ReviewService later)
        data.averageRating = 0.0; // ADDED: Initial rating
        data.totalReviews = 0;    // ADDED: Initial review count
        data.totalJobsCompleted = 0; // ADDED: Initial job count

        // Connect/Create skills
        if (mechanicDto.skills && mechanicDto.skills.length > 0) {
          data.skills = {
            connectOrCreate: mechanicDto.skills.map((skillName) => ({
              where: { name: skillName },
              create: { name: skillName },
            })),
          };
        }
        // ADDED: Experience years
        if (mechanicDto.experienceYears !== undefined) {
          data.experienceYears = mechanicDto.experienceYears;
        }
      }
      // -------------------------------------------------------------------

      this.logger.log('Data object being sent to Prisma for creation.');

      const user = await this.prisma.user.create({
        data,
      });

      // UPDATED: Use the new AuditService
      await this.auditService.log({
        actor: callerId || user.id, // If public signup, actor is the user themselves
        entity: 'User',
        entityId: user.id,
        action: 'CREATE_USER',
        after: {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          // Include new mechanic fields in audit if applicable
          ...(user.role === Role.MECHANIC && {
            shopName: user.shopName,
            isEvSpecialist: user.isEvSpecialist,
            serviceRadiusKm: user.serviceRadiusKm,
            status: user.status,
          }),
        },
      });

      this.logger.log(`Successfully created user with ID: ${user.id}`);

      return plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      this.logger.error(`Failed to create user`, err.stack);
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
   * (No significant changes needed here, as CreateUserDto handles basic fields)
   */
  async signupCustomer(dto: SignupCustomerDto) {
    try {
      const newUserDto: CreateUserDto = {
        email: dto.email,
        password: dto.password,
        role: 'CUSTOMER' as Role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        pushToken: dto.pushToken, // Pass pushToken if it's in SignupCustomerDto
      };

      this.logger.log(`Processing signup for new customer: ${newUserDto.email}`);

      const user = await this.createAndLogUser(newUserDto);

      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.firstName || user.email.split('@')[0], // Use firstName for email personalization
        role: user.role,
        password: newUserDto.password, // Only if you explicitly want to send raw password (not recommended)
      });

      return { success: true, message: 'Customer signup successful', data: user };
    } catch (err) {
      this.logger.error(`Customer signup failed`, err.stack);
      if (err instanceof BadRequestException || err instanceof ConflictException) {
        throw err;
      }
      throw new InternalServerErrorException('Customer signup failed');
    }
  }

  // ---

  /**
   * Public signup for mechanics.
   * CHANGED: DTO passed to createAndLogUser now contains all new mechanic fields.
   */
  async signupMechanic(dto: SignupMechanicDto) {
    try {
      // Direct pass of SignupMechanicDto which now extends CreateUserDto (or is a superset)
      // and contains all necessary mechanic fields.
      this.logger.log(`Processing signup for new mechanic: ${dto.email}`);

      // All mechanic-specific fields from SignupMechanicDto will be handled by createAndLogUser
      const user = await this.createAndLogUser(dto);

      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.firstName || user.email.split('@')[0],
        role: user.role,
        password: dto.password, // Only if you explicitly want to send raw password (not recommended)
        shopName: user.shopName,
      });

      return { success: true, message: 'Mechanic signup successful', data: user };
    } catch (err) {
      this.logger.error(`Mechanic signup failed`, err.stack);
      if (err instanceof BadRequestException || err instanceof ConflictException) {
        throw err;
      }
      throw new InternalServerErrorException('Mechanic signup failed');
    }
  }


  /**
   * Admin-initiated user creation.
   * (No significant changes needed here, as createAndLogUser handles the logic)
   */
  async createUser(dto: CreateUserDto, callerId: string, callerRole: string) {
    try {
      this.logger.log(`Admin ${callerId} creating user with email: ${dto.email}`);

      const user = await this.createAndLogUser(dto, callerId, callerRole);

      await this.mailService.sendWelcomeEmail(user.email, {
        name: user.firstName || user.email.split('@')[0],
        role: user.role,
        password: dto.password, // Only if you explicitly want to send raw password (not recommended)
        shopName: user.shopName,
      });

      return { success: true, message: 'User created', data: user };
    } catch (err) {
      this.logger.error(`Admin user creation failed`, err.stack);
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


  /**
   * Retrieves all users with pagination and filtering.
   * CHANGED: Added new filter options for mechanic-specific fields.
   * CHANGED: `UserResponseDto` will need to reflect new fields.
   */
  async getAllUsers(
    page = 1,
    limit = 10,
    filters?: {
      role?: Role;
      q?: string;
      status?: Status; // ADDED: Filter by account status (e.g., PENDING, APPROVED)
      isEvSpecialist?: boolean; // ADDED: Filter by EV specialist status
      isAvailableForJobs?: boolean; // ADDED: Filter by current job availability
      minRating?: number; // ADDED: Filter by minimum average rating
    },
  ) {
    try {
      this.logger.log(`Fetching users with filters: ${JSON.stringify(filters)}`);

      const take = Math.min(Math.max(1, limit), 100);
      const skip = Math.max(0, (page - 1) * take);
      const where: Prisma.UserWhereInput = { deletedAt: null }; // CHANGED: Use Prisma.UserWhereInput for type safety

      if (filters?.role) where.role = filters.role;
      if (filters?.status) where.status = filters.status; // ADDED: Status filter
      if (filters?.isEvSpecialist !== undefined) {
        where.isEvSpecialist = filters.isEvSpecialist; // ADDED: EV Specialist filter
      }
      if (filters?.isAvailableForJobs !== undefined) {
        where.isAvailableForJobs = filters.isAvailableForJobs; // ADDED: Availability filter
      }
      if (filters?.minRating !== undefined) {
        where.averageRating = { gte: filters.minRating }; // ADDED: Min rating filter
      }

      if (filters?.q) {
        where.OR = [
          { email: { contains: filters.q, mode: 'insensitive' } },
          { shopName: { contains: filters.q, mode: 'insensitive' } },
          { firstName: { contains: filters.q, mode: 'insensitive' } },
          { lastName: { contains: filters.q, mode: 'insensitive' } },
          { phoneNumber: { contains: filters.q, mode: 'insensitive' } },
          // ADDED: Search by skills if query matches a skill name
          {
            role: Role.MECHANIC, // Only search mechanic skills
            skills: {
              some: {
                name: { contains: filters.q, mode: 'insensitive' },
              },
            },
          },
        ];
      }

      this.logger.log(`Prisma 'where' clause for getAllUsers: ${JSON.stringify(where)}`);

      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          take,
          skip,
          // ADDED: Include skills when fetching users (especially for mechanics)
          include: {
            skills: { select: { id: true, name: true } },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      if (!users.length) {
        this.logger.warn('No users found for the given filters.');
        // Consider returning empty array with pagination info instead of NotFoundException for general searches
        return {
          success: true,
          message: 'No users found for the given criteria.',
          data: {
            users: [],
            pagination: {
              page,
              limit: take,
              total: 0,
              totalPages: 0,
            },
          },
        };
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
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }


  /**
   * Retrieves a single user by ID.
   * CHANGED: Will now return all new fields. Includes skills for mechanics.
   */
  async getUserById(id: string, callerId: string, callerRole: string) {
    try {
      this.logger.log(`Searching for user with ID: ${id} by caller: ${callerId}`);

      if (callerId !== id && callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
        this.logger.warn(`Forbidden: Caller ${callerId} tried to access user profile ${id}.`);
        throw new ForbiddenException('Insufficient permissions to view this user profile');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        // ADDED: Include skills for mechanics when fetching a single user
        include: {
          skills: { select: { id: true, name: true } },
          // Potentially include MechanicServices, Reviews etc. based on what the frontend needs for a profile page
          mechanicServices: user.role === Role.MECHANIC ? {
            select: { id: true, title: true, price: true } // Example selection
          } : undefined,
          reviews: user.role === Role.MECHANIC ? { // Only include reviews if the user is a mechanic
            select: { id: true, rating: true, comment: true, customer: { select: { firstName: true, lastName: true } } },
            take: 5, // Limit reviews for preview
            orderBy: { createdAt: 'desc' }
          } : undefined,
        },
      });

      if (!user) {
        this.logger.warn(`User with ID ${id} not found.`);
        throw new NotFoundException('User not found');
      }

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
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }


  /**
   * Updates a user's profile.
   * CHANGED: Now handles all new mechanic-specific fields.
   * CHANGED: Audit log structure for new AuditService.
   */
  async updateUser(id: string, dto: UpdateUserDto | MechanicUpdateProfileDto, callerId: string, callerRole: string) {
    try {
      this.logger.log(
        `Attempting to update user ${id} with DTO:`,
        dto,
        `by caller: ${callerId} (${callerRole})`,
      );

      if (callerId !== id && callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
        this.logger.warn(`Forbidden: Caller ${callerId} tried to update user ${id}.`);
        throw new ForbiddenException('Insufficient permissions to update this user');
      }

      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) {
        this.logger.warn(`User ${id} not found for update.`);
        throw new NotFoundException('User not found');
      }

      // -------------------------------------------------------------------
      // CHANGED: Construct updateData more robustly for all potential fields
      // -------------------------------------------------------------------
      const updateData: Prisma.UserUpdateInput = {};

      if (dto.email) updateData.email = dto.email.toLowerCase();
      if (dto.password) updateData.password = await bcrypt.hash(dto.password, 12);
      if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
      if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
      if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
      if (dto.pushToken !== undefined) updateData.pushToken = dto.pushToken;
      if (dto.bio !== undefined) updateData.bio = dto.bio; // ADDED: Update bio
      if (dto.profilePictureUrl !== undefined) updateData.profilePictureUrl = dto.profilePictureUrl; // ADDED: Update profile picture URL
      if (dto.certificationUrls !== undefined) updateData.certificationUrls = dto.certificationUrls; // ADDED: Update certification URLs

      // Admin-only updates for user status (e.g., approving a mechanic)
      if (callerRole === Role.ADMIN || callerRole === Role.SUPERADMIN) {
        if (dto instanceof UpdateUserDto && dto.status !== undefined) { // Assuming UpdateUserDto has status
          updateData.status = dto.status;
        }
        if (dto instanceof UpdateUserDto && dto.role !== undefined && dto.role !== existing.role) {
          // You might need more complex logic if roles can be changed, especially for mechanics
          throw new BadRequestException("Role changes are not directly handled here or require specific admin logic.");
        }
      }

      // -------------------------------------------------------------------
      // CHANGED/ADDED: Mechanic-specific updates
      // This block now handles all new fields relevant for mechanics
      // -------------------------------------------------------------------
      if (existing.role === Role.MECHANIC) {
        const mechanicUpdateDto = dto as MechanicUpdateProfileDto; // Cast to access mechanic-specific fields

        if (mechanicUpdateDto.shopName !== undefined) updateData.shopName = mechanicUpdateDto.shopName;
        if (mechanicUpdateDto.experienceYears !== undefined) updateData.experienceYears = mechanicUpdateDto.experienceYears;
        if (mechanicUpdateDto.isEvSpecialist !== undefined) updateData.isEvSpecialist = mechanicUpdateDto.isEvSpecialist;
        if (mechanicUpdateDto.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = mechanicUpdateDto.serviceRadiusKm;
        if (mechanicUpdateDto.currentLat !== undefined) updateData.currentLat = mechanicUpdateDto.currentLat;
        if (mechanicUpdateDto.currentLng !== undefined) updateData.currentLng = mechanicUpdateDto.currentLng;
        if (mechanicUpdateDto.isAvailableForJobs !== undefined) updateData.isAvailableForJobs = mechanicUpdateDto.isAvailableForJobs;
        if (mechanicUpdateDto.mechanicOnlineStatus !== undefined) updateData.mechanicOnlineStatus = mechanicUpdateDto.mechanicOnlineStatus;


        // Handle skills update for mechanics
        if (mechanicUpdateDto.skills !== undefined) {
          // This logic will disconnect existing skills and connect new ones
          updateData.skills = {
            set: [], // Disconnect all existing skills
            connectOrCreate: mechanicUpdateDto.skills.map((skillName) => ({
              where: { name: skillName },
              create: { name: skillName },
            })),
          };
        }
      }
      // -------------------------------------------------------------------

      this.logger.log('Final update data for user update.');

      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
        // ADDED: Include skills in the response if it's a mechanic
        include: {
          skills: true,
        },
      });

      // CHANGED: Use the new AuditService
      await this.auditService.log({
        actor: callerId,
        entity: 'User',
        entityId: id,
        action: 'UPDATE_USER',
        before: { email: existing.email, status: existing.status, ...((existing.role === Role.MECHANIC) && { shopName: existing.shopName, isEvSpecialist: existing.isEvSpecialist, serviceRadiusKm: existing.serviceRadiusKm }) }, // Example fields
        after: { email: updated.email, status: updated.status, ...((updated.role === Role.MECHANIC) && { shopName: updated.shopName, isEvSpecialist: updated.isEvSpecialist, serviceRadiusKm: updated.serviceRadiusKm }) }, // Example fields
        metadata: dto as any, // Log the DTO as metadata for full details of changes
      });

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
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }


  /**
   * Soft deletes a user.
   * (No significant changes needed here, as logic is about setting deletedAt)
   */
  async deleteUser(id: string, callerId: string, callerRole: string) {
    try {
      this.logger.log(`Attempting to delete user ${id} by caller: ${callerId} (${callerRole})`);

      if (callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN) {
        this.logger.warn(`Forbidden: Caller ${callerId} tried to delete user ${id}.`);
        throw new ForbiddenException('You do not have permission to delete users');
      }

      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) {
        this.logger.warn(`User ${id} not found for deletion.`);
        throw new NotFoundException('User not found');
      }

      const deleted = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // CHANGED: Use the new AuditService
      await this.auditService.log({
        actor: callerId,
        entity: 'User',
        entityId: id,
        action: 'SOFT_DELETE_USER',
        before: { deletedAt: existing.deletedAt },
        after: { deletedAt: deleted.deletedAt },
      });

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
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}