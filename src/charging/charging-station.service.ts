import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Inject } from '@nestjs/common';
import {
  IMapsService,
  MAPS_SERVICE_TOKEN,
} from 'src/common/interfaces/maps-service.interface';
import { FindChargingStationsDto, ChargingStationDto } from './dto/charging-station.dto';

@Injectable()
export class ChargingStationService {
  private readonly logger = new Logger(ChargingStationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(MAPS_SERVICE_TOKEN) private readonly maps: IMapsService,
  ) {}

  /**
   * Find nearby charging stations
   * Uses Open Charge Map API (free) or Google Places API
   */
  async findNearbyStations(dto: FindChargingStationsDto): Promise<ChargingStationDto[]> {
    const operation = 'Find nearby charging stations';
    this.logger.log(`[${operation}] Lat: ${dto.latitude}, Lng: ${dto.longitude}`);

    try {
      const radiusKm = dto.radiusKm || 10;
      const radiusMeters = radiusKm * 1000;

      // Try Open Charge Map API first (free, no key required)
      try {
        const stations = await this.fetchFromOpenChargeMap(
          dto.latitude,
          dto.longitude,
          radiusMeters,
          dto.connectorType,
          dto.available,
        );
        return stations;
      } catch (error) {
        this.logger.warn(`Open Charge Map failed, trying Google Places: ${error.message}`);
        // Fallback to Google Places API
        return await this.fetchFromGooglePlaces(
          dto.latitude,
          dto.longitude,
          radiusMeters,
          dto.connectorType,
          dto.available,
        );
      }
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to find charging stations');
    }
  }

  /**
   * Get charging station details by ID
   */
  async getStationDetails(stationId: string, provider: string = 'OPEN_CHARGE_MAP'): Promise<ChargingStationDto> {
    const operation = `Get station details for ${stationId}`;
    this.logger.log(`[${operation}]`);

    try {
      if (provider === 'OPEN_CHARGE_MAP') {
        const response = await firstValueFrom(
          this.httpService.get(`https://api.openchargemap.io/v3/poi/${stationId}`, {
            params: {
              key: this.configService.get<string>('OPEN_CHARGE_MAP_API_KEY') || 'demo',
            },
          }),
        );

        return this.mapOpenChargeMapStation(response.data);
      }

      throw new BadRequestException(`Unsupported provider: ${provider}`);
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get station details');
    }
  }

  /**
   * Calculate route to nearest charging station
   */
  async getRouteToStation(
    fromLat: number,
    fromLng: number,
    stationId: string,
    stationLat: number,
    stationLng: number,
  ) {
    const operation = 'Get route to charging station';
    this.logger.log(`[${operation}]`);

    try {
      if (!this.maps.getRoute) {
        // Fallback: distance + duration only
        const { distanceMeters, durationSeconds } = await this.maps.getDistanceAndDuration(
          { lat: fromLat, lng: fromLng },
          { lat: stationLat, lng: stationLng },
        );
        return {
          distanceMeters,
          durationSeconds,
          polyline: null,
          steps: [],
        };
      }

      return await this.maps.getRoute(
        { lat: fromLat, lng: fromLng },
        { lat: stationLat, lng: stationLng },
      );
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to calculate route');
    }
  }

  private async fetchFromOpenChargeMap(
    lat: number,
    lng: number,
    radiusMeters: number,
    connectorType?: string,
    available?: boolean,
  ): Promise<ChargingStationDto[]> {
    const params: any = {
      latitude: lat,
      longitude: lng,
      distance: radiusMeters / 1000, // Convert to km
      distanceunit: 'KM',
      maxresults: 50,
      key: this.configService.get<string>('OPEN_CHARGE_MAP_API_KEY') || 'demo',
    };

    if (connectorType) {
      params.connectiontypeid = this.mapConnectorType(connectorType);
    }

    const response = await firstValueFrom(
      this.httpService.get('https://api.openchargemap.io/v3/poi', { params }),
    );

    return response.data.map((station: any) => this.mapOpenChargeMapStation(station, lat, lng));
  }

  private async fetchFromGooglePlaces(
    lat: number,
    lng: number,
    radiusMeters: number,
    connectorType?: string,
    available?: boolean,
  ): Promise<ChargingStationDto[]> {
    // Google Places API implementation
    // This would use Google Places API to search for EV charging stations
    // For now, return empty array (requires Google Places API key and setup)
    this.logger.warn('Google Places API not fully implemented');
    return [];
  }

  private mapOpenChargeMapStation(station: any, userLat?: number, userLng?: number): ChargingStationDto {
    const connectors = (station.Connections || []).map((conn: any) => ({
      type: conn.ConnectionType?.Title || 'Unknown',
      powerKw: conn.PowerKW || 0,
      isAvailable: conn.StatusType?.IsOperational !== false,
      status: conn.StatusType?.Title || 'Unknown',
    }));

    let distanceKm = 0;
    if (userLat && userLng && station.AddressInfo?.Latitude && station.AddressInfo?.Longitude) {
      // Calculate distance using Haversine formula
      distanceKm = this.calculateDistance(
        userLat,
        userLng,
        station.AddressInfo.Latitude,
        station.AddressInfo.Longitude,
      );
    }

    return {
      id: station.ID?.toString() || '',
      name: station.AddressInfo?.Title || 'Unnamed Station',
      latitude: station.AddressInfo?.Latitude || 0,
      longitude: station.AddressInfo?.Longitude || 0,
      address: station.AddressInfo?.AddressLine1 || '',
      connectors,
      distanceKm: Number(distanceKm.toFixed(2)),
      isAvailable: connectors.some((c: any) => c.isAvailable),
      provider: 'OPEN_CHARGE_MAP',
    };
  }

  private mapConnectorType(type: string): number {
    // Open Charge Map connector type IDs
    const typeMap: Record<string, number> = {
      CCS: 33, // CCS (Type 2)
      CHADEMO: 2, // CHAdeMO
      TYPE2: 25, // Type 2 (Mennekes)
      TYPE1: 1, // Type 1 (J1772)
    };
    return typeMap[type.toUpperCase()] || 0;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
