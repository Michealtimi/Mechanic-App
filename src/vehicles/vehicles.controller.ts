import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../common/guard/roles.guards';
import { TenantGuard } from '../common/guard/tenant.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully', type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (invalid data or VIN already exists)' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to organization)' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async createVehicle(
    @Body() dto: CreateVehicleDto,
    @Req() req,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const vehicle = await this.vehiclesService.createVehicle(dto, userId, userRole, tenantId);
    return plainToInstance(VehicleResponseDto, vehicle, { excludeExtraneousValues: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully', type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  async getVehicle(@Param('id') id: string, @Req() req, @TenantId() tenantId: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const vehicle = await this.vehiclesService.getVehicle(id, userId, userRole, tenantId);
    return plainToInstance(VehicleResponseDto, vehicle, { excludeExtraneousValues: true });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully', type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid data)' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @Req() req,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const vehicle = await this.vehiclesService.updateVehicle(id, dto, userId, userRole, tenantId);
    return plainToInstance(VehicleResponseDto, vehicle, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vehicle (soft delete)' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  @ApiResponse({ status: 400, description: 'Bad request (vehicle has active bookings)' })
  async deleteVehicle(@Param('id') id: string, @Req() req, @TenantId() tenantId: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.vehiclesService.deleteVehicle(id, userId, userRole, tenantId);
  }

  @Get('org/:orgId')
  @ApiOperation({ summary: 'Get all vehicles for an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully', type: [VehicleResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to organization)' })
  async getOrgVehicles(@Param('orgId') orgId: string, @Req() req, @TenantId() tenantId: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const vehicles = await this.vehiclesService.getOrgVehicles(orgId, userId, userRole, tenantId);
    return plainToInstance(VehicleResponseDto, vehicles, { excludeExtraneousValues: true });
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update vehicle location' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', example: 6.5244 },
        lng: { type: 'number', example: 3.3792 },
      },
      required: ['lat', 'lng'],
    },
  })
  @ApiResponse({ status: 200, description: 'Location updated successfully', type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid coordinates)' })
  async updateVehicleLocation(
    @Param('id') id: string,
    @Body() location: { lat: number; lng: number },
    @Req() req,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const vehicle = await this.vehiclesService.updateVehicleLocation(
      id,
      location.lat,
      location.lng,
      userId,
      userRole,
      tenantId,
    );
    return plainToInstance(VehicleResponseDto, vehicle, { excludeExtraneousValues: true });
  }

  @Post(':id/service-records')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add service record (Invisible Foreman)',
    description: 'Manual or telemetry service record for Predictive Fleet Garage.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'oil_change' },
        serviceDate: { type: 'string', format: 'date-time' },
        odometerKm: { type: 'number' },
        notes: { type: 'string' },
        bookingId: { type: 'string' },
        bookingSegmentId: { type: 'string' },
        source: { type: 'string', enum: ['MANUAL', 'TELEMETRY'] },
      },
      required: ['type', 'serviceDate'],
    },
  })
  @ApiResponse({ status: 201, description: 'Service record created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async createServiceRecord(
    @Param('id') id: string,
    @Body() dto: { type: string; serviceDate: string; odometerKm?: number; notes?: string; bookingId?: string; bookingSegmentId?: string; source?: string },
    @Req() req,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.vehiclesService.createServiceRecord(
      id,
      {
        ...dto,
        serviceDate: new Date(dto.serviceDate),
        source: dto.source === 'TELEMETRY' ? ('TELEMETRY' as any) : undefined,
      },
      userId,
      userRole,
      tenantId,
    );
  }

  @Get(':id/service-history')
  @ApiOperation({
    summary: 'Get service history (Invisible Foreman)',
    description: 'List service records for Predictive Fleet Garage.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Service history' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getServiceHistory(@Param('id') id: string, @Req() req, @TenantId() tenantId: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.vehiclesService.getServiceHistory(id, userId, userRole, tenantId);
  }
}
