/* eslint-disable prettier/prettier */
 
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes,} from '@nestjs/swagger';
import { MechanicService } from './mechanic.service';

import { CreateMechanicServiceDto } from './dto/create-mechanic-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';


import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { UpdateMechanicDto } from './dto/update.mechanic.dto';
import { MechanicProfileResponseDto } from './dto/mechanic-profile--response.dto';

@ApiTags('Mechanic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MECHANIC)
@Controller('mechanic')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get logged-in mechanic profile' })
  @ApiResponse({ status: 200, type: MechanicProfileResponseDto })
  async getProfile(@Req() req) {
    return this.mechanicService.getMechanicProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update logged-in mechanic profile' })
  @ApiResponse({ status: 200, type: MechanicProfileResponseDto })
  async updateProfile(@Req() req, @Body() dto: UpdateMechanicDto) {
    return this.mechanicService.updateMechanicProfile(req.user.id, dto);
  }

  @Post('certification')
  @ApiOperation({ summary: 'Upload certification' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertification(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mechanicService.saveCertification(req.user.id, file.filename);
  }

  @Post('profile-picture')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mechanicService.uploadProfilePicture(req.user.id, file);
  }

  @Post('service')
  @ApiOperation({ summary: 'Create a service for logged-in mechanic' })
  @ApiResponse({ status: 201, type: ServiceResponseDto })
  async createService(@Req() req, @Body() dto: CreateMechanicServiceDto) {
    return this.mechanicService.createService(req.user.id, dto);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all services for logged-in mechanic' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  async getServices(@Req() req) {
    return this.mechanicService.getAllMechanicServices(req.user.id);
  }

  @Patch('service/:id')
  @ApiOperation({ summary: 'Update a service for logged-in mechanic' })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  async updateService(
    @Req() req,
    @Body() dto: UpdateServiceDto,
    @Param('id') id: string,
  ) {
    return this.mechanicService.updateMechanicService(id, req.user.id, dto);
  }

  @Delete('service/:id')
  @ApiOperation({ summary: 'Delete a service for logged-in mechanic' })
  async deleteService(@Req() req, @Param('id') id: string) {
    return this.mechanicService.deleteMechanicService(id, req.user.id);
  }
}
