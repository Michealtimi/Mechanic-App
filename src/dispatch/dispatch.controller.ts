/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Req, Param, Patch, Get, Query } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { IsOptional, IsString } from 'class-validator';
import { CreateDispatchDto } from './dto/dispatch.dto';
import { DispatchAnalyticsDto, MechanicAvailabilityDto } from './dto/dispatch-analytics.dto';
import { Role } from '@prisma/client';
/**
 * DTO for Dispatch Rejection
 */
class RejectDispatchDto {
    @IsOptional()
    @IsString()
    reason?: string;
}


@ApiTags('Dispatch')
@ApiBearerAuth() // Indicates that authentication is required for all endpoints
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('available-mechanics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List available mechanics near a location (for map/list)' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lng', type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in km (default 10)' })
  @ApiResponse({ status: 200, description: 'List of available mechanics' })
  async getAvailableMechanics(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.dispatchService.getAvailableMechanics(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 10,
    );
  }

  // 1. CREATE DISPATCH (Initiates Assignment)
  // Used by an administrator or the system to assign a job.
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign a mechanic to a booking (auto-match or specific manual assignment)' })
  async create(@Req() req: User, @Body() dto: CreateDispatchDto) {
    // req.user.id is the ID of the entity initiating the dispatch (e.g., an Admin or the system itself)
    const user= req.user.id; 
    return this.dispatchService.createDispatch(dto, user);
  }

  // 2. ACCEPT DISPATCH
  // Used by a MECHANIC to accept an assigned job.
  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mechanic accepts a dispatch assignment, confirming the booking' })
  async accept(@Req() req: UserRequest, @Param('id') id: string) {
    // req.user.id must be the mechanic's ID
    const mechanicId = req.user.id;
    return this.dispatchService.acceptDispatch(id, mechanicId);
  }

  // 3. REJECT DISPATCH
  // Used by a MECHANIC to reject an assigned job.
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mechanic rejects a dispatch assignment' })
  @ApiBody({ type: RejectDispatchDto, required: false, description: 'Optional reason for rejection' })
  async reject(@Req() req: any, @Param('id') id: string, @Body() body: RejectDispatchDto) {
    const mechanicId = req.user.id;
    return this.dispatchService.rejectDispatch(id, mechanicId, body?.reason);
  }

  @Post('bidding/:bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create dispatch with bidding system (Admin only)' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiQuery({ name: 'maxBids', required: false, type: Number, description: 'Maximum number of bids (default: 3)' })
  @ApiResponse({ status: 200, description: 'Dispatch offers created' })
  async createWithBidding(
    @Param('bookingId') bookingId: string,
    @Query('maxBids') maxBids?: string,
  ) {
    return this.dispatchService.createDispatchWithBidding(bookingId, maxBids ? parseInt(maxBids) : 3);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get dispatch analytics (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiResponse({ status: 200, description: 'Analytics retrieved', type: DispatchAnalyticsDto })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tenantId') tenantId?: string,
    @Req() req?: any,
  ) {
    if (req?.user?.tenantId && !tenantId) {
      tenantId = req.user.tenantId;
    }
    return this.dispatchService.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      tenantId,
    );
  }

  @Get('mechanics/:mechanicId/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MECHANIC)
  @ApiOperation({ summary: 'Predict mechanic availability' })
  @ApiParam({ name: 'mechanicId', description: 'Mechanic ID' })
  @ApiResponse({ status: 200, description: 'Availability prediction', type: MechanicAvailabilityDto })
  async getMechanicAvailability(@Param('mechanicId') mechanicId: string) {
    return this.dispatchService.predictMechanicAvailability(mechanicId);
  }
}