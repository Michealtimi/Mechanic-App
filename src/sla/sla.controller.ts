/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Param, Get, Query, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { SlaDashboardDto, SlaAnalyticsDto } from './dto/sla.dto';

@ApiTags('SLA Monitoring')
@ApiBearerAuth()
@Controller('sla')
export class SlaController {
  constructor(private readonly sla: SlaService) {}

  /**
   * 1. UPSERT SLA RECORD (System/Admin Use)
   */
  @Post(':bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SYSTEM) // Only trusted roles can record timestamps
  @ApiOperation({ summary: 'Records a new timestamp (assignedAt, completedAt, etc.) for a booking.' })
  // We specify 'any' and provide examples since the formal DTO class is omitted
  @ApiBody({ type: Object, description: 'Partial update object containing the timestamp(s) to record.', examples: {
      assigned: { value: { assignedAt: new Date().toISOString() } },
      completed: { value: { completedAt: new Date().toISOString() } }
  }})
  async upsert(
    @Param('bookingId', ParseUUIDPipe) bookingId: string, 
    @Body() body: any // Accepts generic object input
  ) {
    return this.sla.createOrPatchSlaRecord(bookingId, body);
  }

  /**
   * 2. GET SLA METRICS (Admin/Reporting Use)
   */
  @Get(':bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Restrict access to reporting roles
  @ApiOperation({ summary: 'Retrieves raw SLA record and computed duration metrics for a booking.' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'SLA record retrieved' })
  async get(@Param('bookingId') bookingId: string) {
    return this.sla.getSla(bookingId);
  }

  @Patch(':bookingId/met')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.SYSTEM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark SLA as MET (Admin/System only)' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'SLA marked as MET' })
  async markMet(@Param('bookingId') bookingId: string) {
    return this.sla.markSlaMet(bookingId);
  }

  @Post(':bookingId/penalty')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply penalty for SLA breach (Admin only)' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 500 },
        reason: { type: 'string', example: 'Late arrival' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Penalty applied' })
  async applyPenalty(
    @Param('bookingId') bookingId: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.sla.applyPenalty(bookingId, body.amount, body.reason);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get SLA dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics', type: SlaDashboardDto })
  async getDashboardStats(@Query('tenantId') tenantId?: string) {
    return this.sla.getDashboardStats(tenantId);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get SLA analytics (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiResponse({ status: 200, description: 'Analytics retrieved', type: SlaAnalyticsDto })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.sla.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      tenantId,
    );
  }
}