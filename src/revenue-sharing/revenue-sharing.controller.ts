import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RevenueSharingService } from './revenue-sharing.service';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../common/guard/roles.guards';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { RevenueShareDto, RevenueReportDto, RevenueFilterDto } from './dto/revenue-sharing.dto';

@ApiTags('Revenue Sharing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('revenue-sharing')
export class RevenueSharingController {
  constructor(private readonly revenueSharingService: RevenueSharingService) {}

  @Get('booking/:bookingId')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Calculate revenue share for a booking (Admin only)' })
  @ApiResponse({ status: 200, description: 'Revenue share calculated', type: RevenueShareDto })
  async getBookingRevenueShare(@Param('bookingId') bookingId: string): Promise<RevenueShareDto> {
    return await this.revenueSharingService.calculateRevenueShare(bookingId);
  }

  @Get('report')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get revenue report (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'mechanicId', required: false, type: String })
  @ApiQuery({ name: 'externalOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved', type: RevenueReportDto })
  async getRevenueReport(@Query() filters: RevenueFilterDto): Promise<RevenueReportDto> {
    return await this.revenueSharingService.getRevenueReport(filters);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MECHANIC)
  @ApiOperation({ summary: 'Get revenue for a specific mechanic' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Mechanic revenue retrieved' })
  async getMechanicRevenue(
    @Param('mechanicId') mechanicId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.revenueSharingService.getMechanicRevenue(
      mechanicId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
