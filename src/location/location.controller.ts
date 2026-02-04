import {
  Controller,
  Param,
  Patch,
  Body,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req, // Assuming you'd get userId from request in a real app
  NotFoundException, // Import for explicit error handling
} from '@nestjs/common';
import { GeoService } from './geo.service';
import { UpdateLocationDto, GetNearbyMechanicsDto, MechanicGeoResponseDto } from './dto/geo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'; // Assuming you have an auth guard
import { RolesGuard } from 'src/common/guard/roles.guards'; // Assuming a roles guard
import { Roles } from 'src/common/decorators/roles.decorators'; // Assuming roles decorator
import { Role } from '@prisma/client'; // Assuming Role enum
import { plainToInstance } from 'class-transformer'; // For transforming service response to DTO

@ApiTags('Geo-Location')
@Controller('geo')
// Apply ValidationPipe globally for this controller
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class GeoController {
  constructor(private geoService: GeoService) {}

  @Patch('mechanic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Example: Only mechanics or admins can update location
  @Roles(Role.MECHANIC, Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a mechanic\'s location' })
  @ApiParam({ name: 'id', description: 'ID of the mechanic', type: 'string', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ status: 200, description: 'Mechanic location updated successfully', type: MechanicGeoResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request (validation failed or invalid input)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not authorized to update this location)' })
  @ApiResponse({ status: 404, description: 'Mechanic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async updateLocation(
    @Param('id') mechanicId: string,
    @Body() dto: UpdateLocationDto,
    @Req() req, // Get user info from JWT
  ): Promise<MechanicGeoResponseDto> {
    // In a real app, you'd verify if req.user.id matches mechanicId or if user has ADMIN role
    // For now, we'll just pass it through
    const updatedMechanic = await this.geoService.updateMechanicLocation(
      mechanicId,
      dto.lat,
      dto.lng,
    );
    return plainToInstance(MechanicGeoResponseDto, updatedMechanic, { excludeExtraneousValues: true });
  }

  @Get('geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Geocode an address to coordinates' })
  @ApiQuery({ name: 'address', type: String, description: 'Address to geocode' })
  @ApiResponse({ status: 200, description: 'Coordinates and address' })
  async geocode(@Query('address') address: string) {
    return this.geoService.geocode(address);
  }

  @Get('distance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get distance and duration between two addresses' })
  @ApiQuery({ name: 'origin', type: String, description: 'Origin address' })
  @ApiQuery({ name: 'destination', type: String, description: 'Destination address' })
  @ApiResponse({ status: 200, description: 'Distance (km), duration (min), eta' })
  async distance(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.geoService.getDistance(origin, destination);
  }

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find nearby mechanics based on given coordinates and radius' })
  @ApiQuery({ name: 'lat', type: 'number', description: 'Latitude of the search center', example: 34.05 })
  @ApiQuery({ name: 'lng', type: 'number', description: 'Longitude of the search center', example: -118.24 })
  @ApiQuery({ name: 'radiusKm', type: 'number', description: 'Search radius in kilometers (default: 10)', required: false, example: 25 })
  @ApiResponse({ status: 200, description: 'List of nearby mechanics retrieved successfully', type: [MechanicGeoResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad Request (validation failed for query parameters)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getNearby(
    @Query() query: GetNearbyMechanicsDto, // Use the DTO for query parameters
  ): Promise<MechanicGeoResponseDto[]> {
    const nearbyMechanics = await this.geoService.findNearbyMechanics(
      query.lat,
      query.lng,
      query.radiusKm,
    );
    return plainToInstance(MechanicGeoResponseDto, nearbyMechanics, { excludeExtraneousValues: true });
  }

  // Example: Get location of a specific mechanic (might be useful)
  @Get('mechanic/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific mechanic\'s location' })
  @ApiParam({ name: 'id', description: 'ID of the mechanic', type: 'string', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @ApiResponse({ status: 200, description: 'Mechanic location retrieved successfully', type: MechanicGeoResponseDto })
  @ApiResponse({ status: 404, description: 'Mechanic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getMechanicLocation(
    @Param('id') mechanicId: string,
  ): Promise<MechanicGeoResponseDto> {
    const mechanic = await this.geoService.getMechanicLocation(mechanicId); // Assuming you add this to GeoService
    if (!mechanic) {
      throw new NotFoundException(`Mechanic with ID ${mechanicId} not found.`);
    }
    return plainToInstance(MechanicGeoResponseDto, mechanic, { excludeExtraneousValues: true });
  }
}