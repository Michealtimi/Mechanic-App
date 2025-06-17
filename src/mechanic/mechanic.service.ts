import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
 // Adjust path if needed
import { CreateMechanicDto } from './dto/mechanic.dto';
import { CreatemechanicService } from './dto/create-mechanic-service.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';

@Injectable()
export class MechanicService {
  constructor(private readonly prisma: PrismaService) {}

  async getMechanicProfile(id: string) {
    const mechanic = await this.prisma.user.findUnique({
      where: {id},
      select: { id : true, email: true, role: true}
    });

    if (!mechanic) {
      throw new NotFoundException('Mechanic profile not found');
    }

    return mechanic;
  }

  async updateMechanicProfile(dto:UpdateMechanicDto, id: string) {
  const existing = await this.prisma.user.update({
    where: { id },
    select: { id: true, email: true, role: true },
    data: { 
      ...dto, 
      skills: Array.isArray(dto.skills) ? dto.skills : (dto.skills ? [dto.skills] : undefined) // Assign only the skills array or undefined
    }, 
  });

  if (!existing) {
    throw new NotFoundException('Mechanic profile not found');
  }

  return this.prisma.user.update({
    where: { id }, // Ensure 'id' matches your schema
    data: { 
      ...dto, 
      id,
        skills: Array.isArray(dto.skills) ? dto.skills : (dto.skills ? [dto.skills] : undefined)
       // Convert array to comma-separated string
    }, // Ensure 'id' is included in the data
  });
  }

async saveCertification(id: string, filename: string) {
  return this.prisma.user.update({
    where: { id },
    data: {
      certificationUrls: {
        push: filename
      }
    },
  }); 
}

  async uploadProfilePicture( id: string, file: Express.Multer.File) {
  return this.prisma.user.update({
    where: { id }, // Use userId from the function parameter
    data: {
      profilePictureUrl: file.filename, // Store the filename or a URL
    },
  });
}


//// the mechanic profile are being connected with the prismer.user. which work witht he mechanic profile

////// this is the bridge thta show where the mechanic service is created

  async createService(dto: CreatemechanicService, mechanicId: string) {
    const mechanic = await this.prisma.user.findUnique({
      where: { id: mechanicId }
    });

    if (!mechanic) {
      throw new NotFoundException('Mechanic not found');
    }``

    return this.prisma.mechanicService.create({
      data: {
        ...dto,
        mechanicId: mechanic.id,
      },
    });
  }

  // so far so good adding the mechnaic services they work with
  // .prisma.machanic service this update the servicess of the meachnic

  async getallMechanicservice(id: string) {
    const mechanic = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!mechanic) {
      throw new NotFoundException('Mechanic not found');
    }

    return this.prisma.mechanicService.findMany({
      where: {
        mechanicId: mechanic.id,
      },
    });
  }

  async UpdateMechanicService(dto: CreatemechanicService, id: string, mechanicId : string) {
    const existing = await this.prisma.mechanicService.findUnique({
      where: { id},
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    if (existing.mechanicId !== mechanicId){   /// this is a check to ensure the service belongs to the mechanic
      throw new ForbiddenException('You are not authorized to update this service');
    }
    return this.prisma.mechanicService.update({
      where: { id},
      data: { ...dto },
    });
  }

  async DeleteMechanicService (id: string,  mechanicId: string) {
    const service = await this.prisma.mechanicService.findUnique({
      where: {id},
    })

    if (!service || service.mechanicId !== mechanicId) {
      throw new ForbiddenException('You are not authorized to delete this service');
    }

    return this.prisma.mechanicService.delete({
      where: { id }
    });
  }
}

