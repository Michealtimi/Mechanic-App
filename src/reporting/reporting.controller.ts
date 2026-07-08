import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import {
  ReportFilterDto,
  BookingAnalyticsDto,
  RevenueReportDto,
  MechanicPerformanceDto,
  OrganizationReportDto,
} from './dto/reporting.dto';

@ApiTags('Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('bookings/analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MERCHANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get booking analytics (Admin/OrgAdmin only)' })
  @ApiResponse({ status: 200, description: 'Booking analytics retrieved', type: BookingAnalyticsDto })
  async getBookingAnalytics(
    @Query() filter: ReportFilterDto,
    @Req() req,
  ): Promise<BookingAnalyticsDto> {
    // Apply tenant filter if user is not superadmin
    if (req.user.role !== Role.SUPERADMIN && req.user.tenantId) {
      filter.tenantId = req.user.tenantId;
    }
    return await this.reportingService.getBookingAnalytics(filter);
  }

  @Get('revenue')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MERCHANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get revenue report (Admin/OrgAdmin only)' })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved', type: RevenueReportDto })
  async getRevenueReport(
    @Query() filter: ReportFilterDto,
    @Req() req,
  ): Promise<RevenueReportDto> {
    if (req.user.role !== Role.SUPERADMIN && req.user.tenantId) {
      filter.tenantId = req.user.tenantId;
    }
    if (req.user.role === Role.MERCHANT && req.user.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    return await this.reportingService.getRevenueReport(filter);
  }

  @Get('mechanics/:mechanicId/performance')
  @UseGuards(RolesGuard)
   @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MERCHANT, Role.MECHANIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get mechanic performance report' })
  @ApiParam({ name: 'mechanicId', description: 'Mechanic ID' })
  @ApiResponse({ status: 200, description: 'Mechanic performance retrieved', type: MechanicPerformanceDto })
  async getMechanicPerformance(
    @Param('mechanicId') mechanicId: string,
    @Query() filter: ReportFilterDto,
    @Req() req,
  ): Promise<MechanicPerformanceDto> {
    // Mechanics can only view their own performance
    if (req.user.role === Role.MECHANIC && req.user.id !== mechanicId) {
      throw new ForbiddenException('You can only view your own performance');
    }
    if (req.user.role !== Role.SUPERADMIN && req.user.tenantId) {
      filter.tenantId = req.user.tenantId;
    }
    return await this.reportingService.getMechanicPerformance(mechanicId, filter);
  }

  @Get('organizations/:organizationId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MERCHANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get organization report (Admin/OrgAdmin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization report retrieved', type: OrganizationReportDto })
  async getOrganizationReport(
    @Param('organizationId') organizationId: string,
    @Query() filter: ReportFilterDto,
    @Req() req,
  ): Promise<OrganizationReportDto> {
    // OrgAdmins can only view their own organization
    if (req.user.role === Role.MERCHANT && req.user.organizationId !== organizationId) {
      throw new ForbiddenException('You can only view your own organization report');
    }
    if (req.user.role !== Role.SUPERADMIN && req.user.tenantId) {
      filter.tenantId = req.user.tenantId;
    }
    return await this.reportingService.getOrganizationReport(organizationId, filter);
  }
}
