import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ChargingStationService } from './charging-station.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { FindChargingStationsDto, ChargingStationDto } from './dto/charging-station.dto';

@ApiTags('Charging Stations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('charging-stations')
export class ChargingStationController {
  constructor(private readonly chargingStationService: ChargingStationService) {}

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find nearby charging stations' })
  @ApiResponse({ status: 200, description: 'Charging stations found', type: [ChargingStationDto] })
  async findNearby(@Query() dto: FindChargingStationsDto): Promise<ChargingStationDto[]> {
    return await this.chargingStationService.findNearbyStations(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get charging station details' })
  @ApiParam({ name: 'id', description: 'Station ID' })
  @ApiQuery({ name: 'provider', required: false, description: 'Provider name (default: OPEN_CHARGE_MAP)' })
  @ApiResponse({ status: 200, description: 'Station details', type: ChargingStationDto })
  async getStationDetails(
    @Param('id') id: string,
    @Query('provider') provider?: string,
  ): Promise<ChargingStationDto> {
    return await this.chargingStationService.getStationDetails(id, provider);
  }

  @Get(':id/route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get route to charging station' })
  @ApiParam({ name: 'id', description: 'Station ID' })
  @ApiQuery({ name: 'fromLat', description: 'Starting latitude' })
  @ApiQuery({ name: 'fromLng', description: 'Starting longitude' })
  @ApiQuery({ name: 'stationLat', description: 'Station latitude' })
  @ApiQuery({ name: 'stationLng', description: 'Station longitude' })
  @ApiResponse({ status: 200, description: 'Route calculated' })
  async getRoute(
    @Param('id') id: string,
    @Query('fromLat') fromLat: string,
    @Query('fromLng') fromLng: string,
    @Query('stationLat') stationLat: string,
    @Query('stationLng') stationLng: string,
  ) {
    return await this.chargingStationService.getRouteToStation(
      parseFloat(fromLat),
      parseFloat(fromLng),
      id,
      parseFloat(stationLat),
      parseFloat(stationLng),
    );
  }
}
