// src/mechanic/mechanic.service.ts
/* eslint-disable prettier/prettier */
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
    this.logger.log(`Attempting to get profile for mechanic ID: ${id}`);
    
    // Authorization Check: Only admins and the mechanic themselves can view a profile.
    if (callerRole !== Role.ADMIN && callerRole !== Role.SUPERADMIN && callerRole !== Role.MECHANIC) {
      this.logger.warn(`Unauthorized access attempt by role: ${callerRole}`);
      throw new ForbiddenException('You do not have permission to view this profile.');
    }

    // Fixed: Removed 'select' to use 'include'. Prisma does not allow both in the same query.
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
    return mechanic;
  }

  /**
   * =============================
   * UPDATE Mechanic Profile
   * =============================
   * Updates a single mechanic's profile.
   * Requires caller's ID and role for authorization.
   */
  async updateMechanicProfile(id: string, dto: UpdateMechanicDto, callerId: string) {
    this.logger.log(`Update request for mechanic ID: ${id} by caller ID: ${callerId}`);

    // Authorization Check: A user can only update their own profile
    if (id !== callerId) {
      this.logger.warn(`Forbidden update attempt on profile ID: ${id} by user ID: ${callerId}`);
      throw new ForbiddenException('You can only update your own profile.');
    }

    try {
      // Fixed: Safely map DTO properties to a valid Prisma update input type.
      // This ensures that only valid fields are passed to Prisma.
      const updateData: Prisma.UserUpdateInput = {};

      if (dto.firstName) updateData.firstName = dto.firstName;
      if (dto.lastName) updateData.lastName = dto.lastName;
      if (dto.shopName) updateData.shopName = dto.shopName;
      if (dto.location) updateData.location = dto.location;
      if (dto.bio) updateData.bio = dto.bio;
      if (dto.experienceYears) updateData.experienceYears = dto.experienceYears;

      // Fixed: The skills transformation logic is now correct.
      if (dto.skills && dto.skills.length > 0) {
        const skillNames = dto.skills;

        const existingSkills = await this.prisma.skill.findMany({
          where: { name: { in: skillNames } },
        });

        const skillsToCreateNames = skillNames.filter(
          (name) => !existingSkills.some((s) => s.name === name),
        );

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

      const mechanic = await this.prisma.user.update({
        where: { id, role: Role.MECHANIC },
        data: updateData,
        include: { skills: true } // Include skills in the response
      });

      this.logger.log(`Successfully updated profile for mechanic ID: ${id}`);
      return mechanic;
    } catch (error) {
      this.logger.error(`Failed to update mechanic profile for ID: ${id}. Error: ${error.message}`);
      throw new BadRequestException(
        error.message || 'Failed to update mechanic profile',
      );
    }
  }

  /**
   * =============================
   * Upload Profile Picture
   * =============================
   */
  async uploadProfilePicture(id: string, filename: string, callerId: string) {
    this.logger.log(`Upload profile picture request for user ID: ${id}`);
    
    // Authorization: User can only update their own profile
    if (id !== callerId) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id, role: Role.MECHANIC },
        data: { profilePictureUrl: filename },
      });
      this.logger.log(`Profile picture uploaded for user ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to upload profile picture for user ID: ${id}. Error: ${error.message}`);
      throw new InternalServerErrorException(
        error.message || 'Failed to upload profile picture',
      );
    }
  }

  /**
   * =============================
   * Save Certification
   * =============================
   */
  async saveCertification(id: string, filename: string, callerId: string) {
    this.logger.log(`Save certification request for user ID: ${id}`);
    
    // Authorization: User can only update their own profile
    if (id !== callerId) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          certificationUrls: { push: filename },
        },
      });
      this.logger.log(`Certification saved for user ID: ${id}`);
      return updated.certificationUrls;
    } catch (error) {
      this.logger.error(`Failed to save certification for user ID: ${id}. Error: ${error.message}`);
      throw new InternalServerErrorException(
        error.message || 'Failed to save certification',
      );
    }
  }

  /**
   * =============================
   * Create Mechanic Service
   * =============================
   */
  async createService(mechanicId: string, dto: CreateMechanicServiceDto, callerId: string) {
    this.logger.log(`Create service request for mechanic ID: ${mechanicId}`);
    
    // Authorization: A mechanic can only create services for their own account
    if (mechanicId !== callerId) {
      throw new ForbiddenException('You can only create services for your own account.');
    }

    try {
      const service = await this.prisma.mechanicService.create({
        data: {
          ...dto,
          mechanicId: mechanicId,
        },
      });
      this.logger.log(`Service created successfully for mechanic ID: ${mechanicId}`);
      return service;
    } catch (error) {
      this.logger.error(`Failed to create service for mechanic ID: ${mechanicId}. Error: ${error.message}`);
      throw new InternalServerErrorException(
        error.message || 'Failed to create service',
      );
    }
  }

  /**
   * =============================
   * Get All Mechanic Services
   * =============================
   */
  async getAllMechanicServices(mechanicId: string, callerId: string, callerRole: Role) {
    this.logger.log(`Get all services request for mechanic ID: ${mechanicId}`);

    // Fixed: Corrected typo from SUPER_ADMIN to SUPERADMIN
    // Authorization: Allow the owner and admins to view all services
    const isSelfOrAdmin = mechanicId === callerId || callerRole === Role.ADMIN || callerRole === Role.SUPERADMIN;
    if (!isSelfOrAdmin) {
      throw new ForbiddenException('You are not authorized to view these services.');
    }
    
    const services = await this.prisma.mechanicService.findMany({
      where: { mechanicId },
    });
    return services;
  }

  /**
   * =============================
   * Update Mechanic Service
   * =============================
   */
  async updateMechanicService(id: string, mechanicId: string, dto: UpdateServiceDto) {
    this.logger.log(`Update service request for service ID: ${id}`);

    const service = await this.prisma.mechanicService.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Authorization: A mechanic can only update their own services
    if (service.mechanicId !== mechanicId) {
      throw new ForbiddenException('You are not authorized to update this service.');
    }

    const updated = await this.prisma.mechanicService.update({
      where: { id },
      data: dto,
    });
    this.logger.log(`Service updated successfully for service ID: ${id}`);
    return updated;
  }

  /**
   * =============================
   * Delete Mechanic Service
   * =============================
   */
  async deleteMechanicService(id: string, mechanicId: string) {
    this.logger.log(`Delete service request for service ID: ${id}`);

    const service = await this.prisma.mechanicService.findUnique({
      where: { id },
    });

    if (!service || service.mechanicId !== mechanicId) {
      throw new ForbiddenException('You are not authorized to delete this service');
    }

    await this.prisma.mechanicService.delete({ where: { id } });
    this.logger.log(`Service deleted successfully for service ID: ${id}`);
    
    return {
      success: true,
      message: 'Service deleted successfully',
      data: null,
    };
  }
}