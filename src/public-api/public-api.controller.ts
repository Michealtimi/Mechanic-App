import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { ApiScopes } from './decorators/api-scopes.decorator';
import { BookingService } from '../booking/booking.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { MechanicService } from '../mechanic/mechanic.service';

@ApiTags('Public API')
@ApiHeader({ name: 'X-API-Key', description: 'Your API key' })
@UseGuards(ApiKeyGuard)
@UseInterceptors(RateLimitInterceptor)
@Controller('public')
export class PublicApiController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly vehiclesService: VehiclesService,
    private readonly mechanicService: MechanicService,
  ) {}

  @Get('mechanics')
  @ApiScopes('read')
  @ApiOperation({ summary: 'Get available mechanics (Public API)' })
  @ApiResponse({ status: 200, description: 'Mechanics retrieved' })
  async getMechanics(
    @Req() req,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    // Public API endpoint for getting mechanics
    // Uses API key authentication instead of JWT
    // TODO: Implement findNearbyMechanics method in MechanicService
    return { message: 'Mechanics endpoint - location filtering to be implemented' };
  }

  @Get('vehicles/:id')
  @ApiScopes('read')
  @ApiOperation({ summary: 'Get vehicle details (Public API)' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved' })
  async getVehicle(@Param('id') id: string, @Req() req) {
    // Public API endpoint for vehicle details
    // Note: Should respect organization boundaries
    const apiKey = req.apiKey;
    return await this.vehiclesService.getVehicle(
      id,
      apiKey.userId,
      'USER' as any,
      apiKey.organizationId || '',
    );
  }

  @Get('bookings/:id')
  @ApiScopes('read')
  @ApiOperation({ summary: 'Get booking details (Public API)' })
  @ApiResponse({ status: 200, description: 'Booking retrieved' })
  async getBooking(@Param('id') id: string, @Req() req) {
    // Public API endpoint for booking details
    const apiKey = req.apiKey;
    // Note: Should verify booking belongs to user/organization
    return await this.bookingService.getBookingById(id, apiKey.userId);
  }
}
