import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Role, Prisma } from '@prisma/client';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MechanicService {
  private readonly logger = new Logger(MechanicService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * =============================
   * GET Mechanic Profile
   * =============================
   * Fetches a single mechanic's profile.
   * Requires caller's role for authorization.
   */
  async getMechanicProfile(id: string, callerRole: Role) {
    // LOG: Start of operation
    this.logger.log(`[getMechanicProfile] Starting fetch for ID: ${id}`);
    this.logger.log(`Attempting to get profile for mechanic ID: ${id}`);

    try {
      // Authorization Check: Only admins and the mechanic themselves can view a profile.
      if (
        callerRole !== Role.ADMIN &&
        callerRole !== Role.SUPERADMIN &&
        callerRole !== Role.MECHANIC
      ) {
        this.logger.warn(`Unauthorized access attempt by role: ${callerRole}`);
        throw new ForbiddenException(
          'You do not have permission to view this profile.',
        );
      }

      const mechanic = await this.prisma.user.findUnique({
        where: { id, role: Role.MECHANIC },
        include: {
          skills: true, // Include skills to get the full profile
        },
      });

      if (!mechanic) {
        this.logger.warn(`Mechanic profile not found for ID: ${id}`);
        throw new NotFoundException('Mechanic profile not found');
      }

      this.logger.log(`Successfully fetched profile for mechanic ID: ${id}`);
      // LOG: Success
      this.logger.log(`[getMechanicProfile] Successfully fetched profile for ID: ${id}`);
      return mechanic;
    } catch (err) {
      this.logger.error(`Failed to get mechanic profile for ID ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve mechanic profile');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * UPDATE Mechanic Profile
   * =============================
   */
  async updateMechanicProfile(id: string, dto: UpdateMechanicDto, callerId: string) {
    // LOG: Start of operation
    this.logger.log(`[updateMechanicProfile] Starting update for ID: ${id}`);
    this.logger.log(`Update request for mechanic ID: ${id} by caller ID: ${callerId}`);

    try {
      // Authorization Check: A user can only update their own profile
      if (id !== callerId) {
        this.logger.warn(
          `Forbidden update attempt on profile ID: ${id} by user ID: ${callerId}`,
        );
        throw new ForbiddenException('You can only update your own profile.');
      }

      // Check if user exists and is a mechanic (prevents silent failure)
      const existingMechanic = await this.prisma.user.findUnique({
        where: { id, role: Role.MECHANIC },
      });

      if (!existingMechanic) {
        throw new NotFoundException('Mechanic profile not found.');
      }

      // Fixed: Safely map DTO properties to a valid Prisma update input type.
      const updateData: Prisma.UserUpdateInput = {};

      if (dto.firstName) updateData.firstName = dto.firstName;
      if (dto.lastName) updateData.lastName = dto.lastName;
      if (dto.shopName) updateData.shopName = dto.shopName;
      if (dto.location) updateData.location = dto.location;
      if (dto.bio) updateData.bio = dto.bio;
      if (dto.experienceYears) updateData.experienceYears = dto.experienceYears;

      // Skills update logic (kept outside transaction for the main update)
      if (dto.skills && dto.skills.length > 0) {
        const skillNames = dto.skills;

        const existingSkills = await this.prisma.skill.findMany({
          where: { name: { in: skillNames } },
        });

        const skillsToCreateNames = skillNames.filter(
          (name) => !existingSkills.some((s) => s.name === name),
        );
        
        // LOG: Skill creation info
        this.logger.log(`[updateMechanicProfile] Skills to create: ${skillsToCreateNames.length}`);

        const createdSkills = await this.prisma.$transaction(
          skillsToCreateNames.map((name) =>
            this.prisma.skill.create({ data: { name } }),
          ),
        );

        const allSkills = [...existingSkills, ...createdSkills];
        updateData.skills = {
          set: allSkills.map((s) => ({ id: s.id })),
        };
      }
      
      // LOG: Final update data
      this.logger.log(`[updateMechanicProfile] Final update data for ID: ${id}`);

      const mechanic = await this.prisma.user.update({
        where: { id, role: Role.MECHANIC },
        data: updateData,
        include: { skills: true }, // Include skills in the response
      });

      this.logger.log(`Successfully updated profile for mechanic ID: ${id}`);
      // LOG: Success
      this.logger.log(`[updateMechanicProfile] Update successful for ID: ${id}`);
      return mechanic;
    } catch (err) {
      this.logger.error(`Failed to update mechanic profile for ID: ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      // Assuming database errors might cause a BadRequest or general failure
      throw new InternalServerErrorException('Failed to update mechanic profile');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * Upload Profile Picture
   * =============================
   */
  async uploadProfilePicture(id: string, filename: string, callerId: string) {
    // LOG: Start of operation
    this.logger.log(`[uploadProfilePicture] Attempting upload for user ID: ${id}`);
    this.logger.log(`Upload profile picture request for user ID: ${id}`);

    try {
      // Authorization: User can only update their own profile
      if (id !== callerId) {
        throw new ForbiddenException('You can only update your own profile.');
      }

      // Check for user existence and role
      const existing = await this.prisma.user.findUnique({
        where: { id, role: Role.MECHANIC },
      });
      if (!existing) {
        throw new NotFoundException('Mechanic profile not found.');
      }
      
      const updatedUser = await this.prisma.user.update({
        where: { id, role: Role.MECHANIC },
        data: { profilePictureUrl: filename },
      });
      
      this.logger.log(`Profile picture uploaded for user ID: ${id}`);
      // LOG: Success
      this.logger.log(`[uploadProfilePicture] Filename ${filename} uploaded for user ID: ${id}`);
      
      return updatedUser;
    } catch (err) {
      this.logger.error(`Failed to upload profile picture for user ID: ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to upload profile picture');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * Save Certification
   * =============================
   */
  async saveCertification(id: string, filename: string, callerId: string) {
    // LOG: Start of operation
    this.logger.log(`[saveCertification] Attempting save for user ID: ${id}`);
    this.logger.log(`Save certification request for user ID: ${id}`);

    try {
      // Authorization: User can only update their own profile
      if (id !== callerId) {
        throw new ForbiddenException('You can only update your own profile.');
      }

      // Check for user existence
      const existing = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException('User not found.');
      }

      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          certificationUrls: { push: filename },
        },
      });
      
      this.logger.log(`Certification saved for user ID: ${id}`);
      // LOG: Success
      this.logger.log(`[saveCertification] Certification ${filename} saved for user ID: ${id}`);
      
      return updated.certificationUrls;
    } catch (err) {
      this.logger.error(`Failed to save certification for user ID: ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to save certification');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * Create Mechanic Service
   * =============================
   */
  async createService(mechanicId: string, dto: CreateMechanicServiceDto, callerId: string) {
    // LOG: Start of operation
    this.logger.log(`[createService] Starting service creation for mechanic ID: ${mechanicId}`);
    this.logger.log(`Create service request for mechanic ID: ${mechanicId}`);

    try {
      // Authorization: A mechanic can only create services for their own account
      if (mechanicId !== callerId) {
        throw new ForbiddenException(
          'You can only create services for your own account.',
        );
      }
      
      // Check that the user is actually a mechanic
      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId, role: Role.MECHANIC },
      });
      if (!mechanic) {
        throw new NotFoundException('Mechanic account not found.');
      }

      const service = await this.prisma.mechanicService.create({
        data: {
          ...dto,
          mechanicId: mechanicId,
        },
      });
      
      this.logger.log(`Service created successfully for mechanic ID: ${mechanicId}`);
      // LOG: Success
      this.logger.log(`[createService] New service ID: ${service.id} created.`);
      
      return service;
    } catch (err) {
      this.logger.error(`Failed to create service for mechanic ID: ${mechanicId}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create service');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * Get All Mechanic Services
   * =============================
   */
  async getAllMechanicServices(
    mechanicId: string,
    callerId: string,
    callerRole: Role,
  ) {
    // LOG: Start of operation
    this.logger.log(`[getAllMechanicServices] Starting fetch for mechanic ID: ${mechanicId}`);
    this.logger.log(`Get all services request for mechanic ID: ${mechanicId}`);

    try {
      // Authorization: Allow the owner and admins to view all services
      const isSelfOrAdmin =
        mechanicId === callerId ||
        callerRole === Role.ADMIN ||
        callerRole === Role.SUPERADMIN;
      if (!isSelfOrAdmin) {
        throw new ForbiddenException(
          'You are not authorized to view these services.',
        );
      }
      
      const services = await this.prisma.mechanicService.findMany({
        where: { mechanicId },
      });
      
      this.logger.log(`Found ${services.length} services for mechanic ID: ${mechanicId}`);
      // LOG: Success
      this.logger.log(`[getAllMechanicServices] Found ${services.length} services.`);
      
      return services;
    } catch (err) {
      this.logger.error(`Failed to get all services for mechanic ID: ${mechanicId}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve services');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * Update Mechanic Service
   * =============================
   */
  async updateMechanicService(
    id: string,
    mechanicId: string,
    dto: UpdateServiceDto,
  ) {
    // LOG: Start of operation
    this.logger.log(`[updateMechanicService] Starting update for service ID: ${id} by mechanic: ${mechanicId}`);
    this.logger.log(`Update service request for service ID: ${id}`);

    try {
      const service = await this.prisma.mechanicService.findUnique({
        where: { id },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // Authorization: A mechanic can only update their own services
      if (service.mechanicId !== mechanicId) {
        throw new ForbiddenException(
          'You are not authorized to update this service.',
        );
      }

      const updated = await this.prisma.mechanicService.update({
        where: { id },
        data: dto,
      });
      
      this.logger.log(`Service updated successfully for service ID: ${id}`);
      // LOG: Success
      this.logger.log(`[updateMechanicService] Service ID: ${id} updated.`);
      
      return updated;
    } catch (err) {
      this.logger.error(`Failed to update service ID: ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to update service');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * Delete Mechanic Service
   * =============================
   */
  async deleteMechanicService(id: string, mechanicId: string) {
    // LOG: Start of operation
    this.logger.log(`[deleteMechanicService] Starting delete for service ID: ${id} by mechanic: ${mechanicId}`);
    this.logger.log(`Delete service request for service ID: ${id}`);

    try {
      const service = await this.prisma.mechanicService.findUnique({
        where: { id },
      });

      // Combine not found and forbidden into a single check for clarity and security
      if (!service || service.mechanicId !== mechanicId) {
        // If service is not found, throw NotFound; if found but wrong owner, throw Forbidden.
        if (!service) {
            throw new NotFoundException('Service not found');
        }
        throw new ForbiddenException('You are not authorized to delete this service');
      }

      await this.prisma.mechanicService.delete({ where: { id } });
      
      this.logger.log(`Service deleted successfully for service ID: ${id}`);
      // LOG: Success
      this.logger.log(`[deleteMechanicService] Service ID: ${id} deleted.`);
      
      return {
        success: true,
        message: 'Service deleted successfully',
        data: null,
      };
    } catch (err) {
      this.logger.error(`Failed to delete service ID: ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to delete service');
    }
  }
}
