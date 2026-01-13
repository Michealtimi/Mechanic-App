/* eslint-disable prettier/prettier */
import { 
  Injectable, 
  Logger, 
  InternalServerErrorException, 
  BadRequestException 
} from '@nestjs/common';
import { 
  Client, 
  TravelMode, 
  DistanceMatrixResponseData,
  UnitSystem
} from '@googlemaps/google-maps-services-js';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from 'src/metrics/metrics.service';

export interface Location {
  lat: number;
  lng: number;
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly metrics: MetricsService // 📊 Track API usage/costs
  ) {
    this.client = new Client({});
    this.apiKey = this.configService.getOrThrow<string>('GOOGLE_MAPS_API_KEY');
  }

  /**
   * Calculates distance and duration between two points.
   * Includes metrics to monitor external API dependency health.
   */
  async getDistanceAndDuration(
    origin: Location,
    destination: Location,
    mode: TravelMode = TravelMode.driving,
  ): Promise<{ distanceMeters: number; durationSeconds: number }> {
    const start = Date.now();
    this.metrics.increment('google_maps_request_total');

    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          mode: mode,
          units: UnitSystem.metric,
          key: this.apiKey,
        },
        timeout: 5000, // ⏱️ Don't let a slow Google API hang our server
      });

      const data = this.validateAndParseResponse(response.data);
      
      // Observe latency
      this.metrics.observe('google_maps_latency_seconds', (Date.now() - start) / 1000);
      
      return data;

    } catch (err: any) {
      this.metrics.increment('google_maps_request_failed_total');
      
      // Log the specific error but throw a clean exception to the user
      this.logger.error(`Maps API Failure: ${err.message}`, err.stack);
      
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not calculate travel estimates');
    }
  }

  /**
   * Private helper to handle Google's complex response status codes
   */
  private validateAndParseResponse(data: DistanceMatrixResponseData) {
    // 1. Check top-level API status
    if (data.status !== 'OK') {
      this.logger.error(`Google Maps API Global Error: ${data.status}`);
      throw new InternalServerErrorException(`Maps service unavailable: ${data.status}`);
    }

    const element = data.rows[0]?.elements[0];

    // 2. Check specific route status
    if (!element) {
      throw new InternalServerErrorException('Malformed Google Maps response');
    }

    switch (element.status) {
      case 'OK':
        return {
          distanceMeters: element.distance.value,
          durationSeconds: element.duration.value,
        };
      case 'ZERO_RESULTS':
        throw new BadRequestException('No route found between these locations');
      case 'NOT_FOUND':
        throw new BadRequestException('One or both locations could not be geocoded');
      case 'OVER_QUERY_LIMIT':
        this.logger.error('Google Maps API Quote Exceeded!');
        throw new InternalServerErrorException('Maps service quota exceeded');
      default:
        this.logger.warn(`Unexpected element status: ${element.status}`);
        throw new BadRequestException(`Distance error: ${element.status}`);
    }
  }
}