// src/mechanic/mechanic.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MechanicService } from './mechanic.service';
import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { GetUser } from 'src/utils/get-user.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

import { RolesGuard } from 'src/common/guard/roles.guards';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mechanic')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

  @Get('profile')
  getMechanicProfile(@GetUser('id') id: string, @GetUser('role') callerRole: Role) {
    // Pass the user's ID and role to the service
    return this.mechanicService.getMechanicProfile(id, callerRole);
  }

  @Patch('profile')
  updateMechanicProfile(
    @GetUser('id') callerId: string,
    @Body() dto: UpdateMechanicDto,
  ) {
    // Pass the caller's ID and the DTO to the service
    return this.mechanicService.updateMechanicProfile(callerId, dto, callerId);
  }

  @Post('certification')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/certifications',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${file.originalname.slice(-4)}`);
        },
      }),
    }),
  )
  saveCertification(
    @GetUser('id') callerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Pass the caller's ID and filename to the service
    return this.mechanicService.saveCertification(callerId, file.filename, callerId);
  }

  @Post('profile-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${file.originalname.slice(-4)}`);
        },
      }),
    }),
  )
  uploadProfilePicture(
    @GetUser('id') callerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Pass the caller's ID and filename to the service
    return this.mechanicService.uploadProfilePicture(callerId, file.filename, callerId);
  }

  @Post('service')
  createService(
    @GetUser('id') callerId: string,
    @Body() dto: CreateMechanicServiceDto,
  ) {
    // Pass the caller's ID and the DTO to the service
    return this.mechanicService.createService(callerId, dto, callerId);
  }

  @Get('services')
  getAllMechanicServices(@GetUser('id') callerId: string, @GetUser('role') callerRole: Role) {
    // Pass both the ID and the caller's role to the service
    return this.mechanicService.getAllMechanicServices(callerId, callerId, callerRole);
  }

  @Patch('service/:id')
  updateMechanicService(
    @Param('id') serviceId: string,
    @GetUser('id') callerId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.mechanicService.updateMechanicService(serviceId, callerId, dto);
  }

  @Delete('service/:id')
  deleteMechanicService(
    @Param('id') serviceId: string,
    @GetUser('id') callerId: string,
  ) {
    return this.mechanicService.deleteMechanicService(serviceId, callerId);
  }
}