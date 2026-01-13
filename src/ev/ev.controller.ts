/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Req, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { EvCertService } from './ev.service';
import { UploadEvCertDto } from './ev.dto';
import { RolesGuard } from 'src/common/guard/roles.guards';

@ApiTags('EV Certification')
@ApiBearerAuth()
@Controller('ev-certs')
export class EvCertController {
  constructor(private readonly evCertService: EvCertService) {}

  // 1. MECHANIC ACTION: Submit Certificate URL
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MECHANIC) // Only mechanics can upload certs
  @ApiOperation({ summary: 'Mechanic uploads a new EV certification document URL for verification.' })
  async upload(@Req() req: UserRequest, @Body() dto: UploadEvCertDto) {
    // Passes the caller ID for authorization check inside the service
    return this.evCertService.uploadCertification(dto, req.user.id);
  }
  
  // 2. MECHANIC/ADMIN ACTION: List Certificates
  @Get('mechanic/:mechanicId')
  @UseGuards(JwtAuthGuard) // Requires authentication to view records
  @ApiOperation({ summary: 'Retrieve all certification records for a specific mechanic.' })
  async list(@Param('mechanicId') mechanicId: string) {
    // Authorization check (e.g., must be the mechanic or an admin) could be added here
    return this.evCertService.listForMechanic(mechanicId);
  }

  // 3. ADMIN ACTION: Verify Certificate
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // ONLY Admin role can verify certificates
  @ApiOperation({ summary: 'ADMIN action to verify a specific EV certification record.' })
  async verify(@Req() req: UserRequest, @Param('id') certId: string) {
    // The admin's ID is passed as the verifierId
    return this.evCertService.verifyCertification(certId, req.user.id);
  }
}