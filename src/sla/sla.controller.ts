/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Param, Get, ParseUUIDPipe } from '@nestjs/common';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

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
  @Roles(Role.ADMIN, Role.MANAGER) // Restrict access to reporting roles
  @ApiOperation({ summary: 'Retrieves raw SLA record and computed duration metrics for a booking.' })
  async get(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.sla.getSla(bookingId);
  }
}