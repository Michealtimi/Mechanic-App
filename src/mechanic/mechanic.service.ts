/* eslint-disable prettier/prettier */
 
 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { MechanicProfileResponseDto } from './dto/mechanic-profile--response.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';

@Injectable()
export class MechanicService {
  constructor(private readonly prisma: PrismaService) {}

  async getMechanicProfile(id: string) {
    try {
      // loop theought he mechanic profile in the database
      // find the ID and returmn the following selected.
      const mechanic = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email : true,
          role: true,
          shopName: true,
          location: true,
          skills: true,
          profilePictureUrl: true,
          bio: true,
          experienceYears: true,
          certificationUrls: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!mechanic) {
        throw new NotFoundException('Mechanic profile not found');
      }

      return {
        success: true,
        message: 'Mechanic profile Fetched successfully',
        data: plainToInstance(MechanicProfileResponseDto, mechanic, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to get mechanic profile',
      );
    }
  }

  async updateMechanicProfile(id: string, dto: UpdateMechanicDto) {
    try {
      const mechanic = await this.prisma.user.update({
        where: { id },
        data: dto, // skills transformation handled by DTO
        select: {
          id: true,
          email: true,
          role: true,
          shopName: true,
          location: true,
          skills: true,
          profilePictureUrl: true,
          bio: true,
          experienceYears: true,
          certificationUrls: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'Mechanic profile updated successfully',
        data: plainToInstance(MechanicProfileResponseDto, mechanic, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to update mechanic profile',
      );
    }
  }

  async saveCertification(id: string, filename: string) {
    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          certificationUrls: { push: filename },
        },
      });

      return {
        success: true,
        message: 'Certification saved successfully',
        data: updated.certificationUrls
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to save certification',
      );
    }
  }

  async uploadProfilePicture(id: string, file: Express.Multer.File) {
    try {
      const updated = await this.prisma.user.update({
       where: { id },
        data: { profilePictureUrl: file.filename },
        select: {
          id: true,
          email: true,
          role: true,
          shopName: true,
          location: true,
          skills: true,
          profilePictureUrl: true,
          bio: true,
          experienceYears: true,
          certificationUrls: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      return {
        success: true,
        message: 'Profile picture uploaded successfully',
        data: plainToInstance(MechanicProfileResponseDto, updated, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to upload profile picture',
      );
    }
  }

  async createService(mechanicId: string, dto: CreateMechanicServiceDto) {
    try {
      // confrim if mechanic exist before creating the service
      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId },
      });

      if (!mechanic) {
        throw new NotFoundException('Mechanic not found');
      }

      // if mechanic exisit it create the service.
      const service = await this.prisma.mechanicService.create({
        data: { ...dto, mechanicId: mechanicId
        },
      });

      return {
        success: true,
        message: 'Service created successfully',
        data: plainToInstance(ServiceResponseDto, service, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to create service',
      );
    }
  }

  async getAllMechanicServices(mechanicId: string) {
    try {
      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId },
      });

      if (!mechanic) {
        throw new NotFoundException('Mechanic not found');
      }

      const services = await this.prisma.mechanicService.findMany({
        where: { mechanicId },
      });

      return {
        success: true,
        message: 'Mechanic services retrieved successfully',
        data: plainToInstance(ServiceResponseDto, services, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to retrieve services',
      );
    }
  }

  async updateMechanicService(
    id: string,
    mechanicId: string,
    dto: UpdateServiceDto,
  ) {
    try {
      const existing = await this.prisma.mechanicService.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Service not found');
      }

      if (existing.mechanicId !== mechanicId) {
        throw new ForbiddenException(
          'You are not authorized to update this service'
        );
      }

      const updated = await this.prisma.mechanicService.update({
        where: { id },
        data: { ...dto },
      });

      return {
        success: true,
        message: 'Service updated successfully',
        data: plainToInstance(ServiceResponseDto, updated, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to update service',
      );
    }
  }

  async deleteMechanicService(id: string, mechanicId: string) {
    try {
      const service = await this.prisma.mechanicService.findUnique({
        where: { id },
      });

      if (!service || service.mechanicId !== mechanicId) {
        throw new ForbiddenException('You are not authorized to delete this service');
      }

      await this.prisma.mechanicService.delete({ where: { id } });

      return {
        success: true,
        message: 'Service deleted successfully',
        data: null,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to delete service',
      );
    }
  }
}
