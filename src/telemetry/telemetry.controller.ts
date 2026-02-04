import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { TelemetryAdapterService } from './telemetry-adapter.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { MetricFilterDto } from './dto/metric-filter.dto';
import { MetricResponseDto } from './dto/metric-response.dto';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../common/guard/roles.guards';
import { TenantGuard } from '../common/guard/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { EvHealthService } from './ev-health.service';

@ApiTags('Telemetry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('vehicles')
export class TelemetryController {
  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly telemetryAdapterService: TelemetryAdapterService,
    private readonly evHealthService: EvHealthService,
  ) {}

  @Post(':id/metrics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a telemetry metric for a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 201, description: 'Metric recorded successfully', type: MetricResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request (invalid metric values)' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  async recordMetric(
    @Param('id') vehicleId: string,
    @Body() dto: CreateMetricDto,
    @Req() req,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    // Override vehicleId from URL
    dto.vehicleId = vehicleId;
    const metric = await this.telemetryService.recordMetric(dto, userId, userRole, tenantId);
    return plainToInstance(MetricResponseDto, metric, { excludeExtraneousValues: true });
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get all telemetry metrics for a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, enum: ['MANUAL', 'SMARTCAR', 'TOR_LOCO', 'HYUNDAI', 'OTHER'] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully', type: [MetricResponseDto] })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  async getVehicleMetrics(
    @Param('id') vehicleId: string,
    @Query() filters: MetricFilterDto,
    @Req() req,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.telemetryService.getVehicleMetrics(vehicleId, filters, userId, userRole, tenantId);
    return {
      data: plainToInstance(MetricResponseDto, result.data, { excludeExtraneousValues: true }),
      meta: result.meta,
    };
  }

  @Get(':id/metrics/latest')
  @ApiOperation({ summary: 'Get the latest telemetry metric for a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Latest metric retrieved successfully', type: MetricResponseDto })
  @ApiResponse({ status: 404, description: 'Vehicle not found or no metrics available' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  async getLatestMetric(@Param('id') vehicleId: string, @Req() req, @TenantId() tenantId: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const metric = await this.telemetryService.getLatestMetric(vehicleId, userId, userRole, tenantId);
    return plainToInstance(MetricResponseDto, metric, { excludeExtraneousValues: true });
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get EV health metrics for a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'EV health metrics' })
  @ApiResponse({ status: 404, description: 'Vehicle not found or not an EV' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to vehicle)' })
  async getVehicleHealth(@Param('id') vehicleId: string, @Req() req, @TenantId() tenantId: string) {
    return this.evHealthService.calculateHealthMetrics(vehicleId);
  }

  @Get(':id/health/alerts')
  @ApiOperation({ summary: 'Get EV health alerts for a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Health alerts' })
  async getVehicleHealthAlerts(@Param('id') vehicleId: string) {
    return this.evHealthService.getHealthAlerts(vehicleId);
  }

  @Post(':id/telemetry/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync telemetry from external provider (Admin/System only)' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiQuery({ name: 'provider', description: 'Provider name (SMARTCAR, TOR_LOCO, etc.)' })
  @ApiQuery({ name: 'accessToken', description: 'Provider access token' })
  @ApiResponse({ status: 200, description: 'Telemetry synced successfully' })
  async syncTelemetry(
    @Param('id') vehicleId: string,
    @Query('provider') provider: string,
    @Query('accessToken') accessToken: string,
  ) {
    return await this.telemetryAdapterService.syncTelemetry(vehicleId, provider, accessToken);
  }

  @Get('telemetry/providers')
  @ApiOperation({ summary: 'Get available telemetry providers' })
  @ApiResponse({ status: 200, description: 'Providers list' })
  async getProviders() {
    return {
      providers: this.telemetryAdapterService.getAvailableProviders(),
    };
  }
}
