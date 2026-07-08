import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExternalMechanicService } from './external-mechanic.service';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../common/guard/roles.guards';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import {
  RegisterExternalMechanicDto,
  ExternalMechanicResponseDto,
  VerifyExternalMechanicDto,
} from './dto/external-mechanic.dto';

@ApiTags('External Mechanics')
@Controller('external-mechanics')
export class ExternalMechanicController {
  constructor(private readonly externalMechanicService: ExternalMechanicService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register as external mechanic (Public)' })
  @ApiResponse({ status: 201, description: 'External mechanic registered', type: ExternalMechanicResponseDto })
  async register(@Body() dto: RegisterExternalMechanicDto): Promise<ExternalMechanicResponseDto> {
    return await this.externalMechanicService.registerExternalMechanic(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all external mechanics (Admin only)' })
  @ApiQuery({ name: 'verifiedOnly', required: false, type: Boolean, description: 'Only return verified mechanics' })
  @ApiResponse({ status: 200, description: 'External mechanics retrieved', type: [ExternalMechanicResponseDto] })
  async getAll(
    @Query('verifiedOnly') verifiedOnly?: string,
  ): Promise<ExternalMechanicResponseDto[]> {
    return await this.externalMechanicService.getAllExternalMechanics(verifiedOnly === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get external mechanic by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'External mechanic retrieved', type: ExternalMechanicResponseDto })
  async getById(@Param('id') id: string): Promise<ExternalMechanicResponseDto> {
    return await this.externalMechanicService.getExternalMechanic(id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify or reject external mechanic (Admin only)' })
  @ApiResponse({ status: 200, description: 'Mechanic verification updated', type: ExternalMechanicResponseDto })
  async verify(
    @Param('id') id: string,
    @Body() dto: VerifyExternalMechanicDto,
    @Req() req,
  ): Promise<ExternalMechanicResponseDto> {
    return await this.externalMechanicService.verifyExternalMechanic(id, dto, req.user.id);
  }

  @Patch(':id/commission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update commission rate for external mechanic (Admin only)' })
  @ApiResponse({ status: 200, description: 'Commission rate updated', type: ExternalMechanicResponseDto })
  async updateCommission(
    @Param('id') id: string,
    @Body() body: { commissionRate: number },
    @Req() req,
  ): Promise<ExternalMechanicResponseDto> {
    return await this.externalMechanicService.updateCommissionRate(id, body.commissionRate, req.user.id);
  }
}
