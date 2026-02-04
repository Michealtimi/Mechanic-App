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
  UnitSystem,
  GeocodingResponseData,
  DirectionsResponseData,
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

  /**
   * GEOCODE ADDRESS: Convert address to coordinates
   */
  async geocodeAddress(address: string): Promise<Location> {
    const start = Date.now();
    this.metrics.increment('google_maps_geocode_total');

    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
        },
        timeout: 5000,
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        this.logger.error(`Geocoding failed for address: ${address}, status: ${data.status}`);
        throw new BadRequestException(`Could not geocode address: ${address}`);
      }

      const location = data.results[0].geometry.location;
      this.metrics.observe('google_maps_geocode_latency_seconds', (Date.now() - start) / 1000);

      return {
        lat: location.lat,
        lng: location.lng,
      };
    } catch (err: any) {
      this.metrics.increment('google_maps_geocode_failed_total');
      this.logger.error(`Geocoding error: ${err.message}`, err.stack);
      
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not geocode address');
    }
  }

  /**
   * REVERSE GEOCODE: Convert coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<{
    address: string;
    formattedAddress: string;
    components: Array<{ type: string; longName: string; shortName: string }>;
  }> {
    const start = Date.now();
    this.metrics.increment('google_maps_reverse_geocode_total');

    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
        timeout: 5000,
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        this.logger.error(`Reverse geocoding failed for coordinates: ${lat}, ${lng}, status: ${data.status}`);
        throw new BadRequestException(`Could not reverse geocode coordinates: ${lat}, ${lng}`);
      }

      const result = data.results[0];
      const components = result.address_components.map(comp => ({
        type: comp.types[0],
        longName: comp.long_name,
        shortName: comp.short_name,
      }));

      this.metrics.observe('google_maps_reverse_geocode_latency_seconds', (Date.now() - start) / 1000);

      return {
        address: result.formatted_address,
        formattedAddress: result.formatted_address,
        components,
      };
    } catch (err: any) {
      this.metrics.increment('google_maps_reverse_geocode_failed_total');
      this.logger.error(`Reverse geocoding error: ${err.message}`, err.stack);
      
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not reverse geocode coordinates');
    }
  }

  /**
   * OPTIMIZE ROUTE: Find the best route when visiting multiple waypoints
   * Uses Google Directions API with waypoint optimization
   */
  async optimizeRoute(
    origin: Location,
    waypoints: Location[],
    destination?: Location,
    mode: TravelMode = TravelMode.driving,
  ): Promise<{
    optimizedWaypoints: Location[];
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    polyline: string;
    steps: Array<{
      distance: number;
      duration: number;
      instruction: string;
      location: Location;
    }>;
  }> {
    const start = Date.now();
    this.metrics.increment('google_maps_route_optimization_total');

    try {
      if (waypoints.length === 0) {
        throw new BadRequestException('At least one waypoint is required');
      }

      // If no destination, use the last waypoint as destination
      const finalDestination = destination || waypoints[waypoints.length - 1];
      const waypointsForOptimization = destination 
        ? waypoints 
        : waypoints.slice(0, -1);

      const response = await this.client.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${finalDestination.lat},${finalDestination.lng}`,
          waypoints: waypointsForOptimization.length > 0
            ? waypointsForOptimization.map(wp => `${wp.lat},${wp.lng}`)
            : undefined,
          optimize: true, // Enable waypoint optimization
          mode: mode,
          key: this.apiKey,
        },
        timeout: 10000, // Longer timeout for route optimization
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        this.logger.error(`Route optimization failed, status: ${data.status}`);
        throw new BadRequestException('Could not optimize route');
      }

      const route = data.routes[0];
      const leg = route.legs[0]; // For simplicity, use first leg (can be extended for multi-leg routes)

      // Extract optimized waypoint order
      const optimizedWaypoints: Location[] = [];
      if (route.waypoint_order) {
        // Reorder waypoints based on optimized order
        route.waypoint_order.forEach((index: number) => {
          optimizedWaypoints.push(waypointsForOptimization[index]);
        });
      } else {
        optimizedWaypoints.push(...waypointsForOptimization);
      }

      // Add destination at the end
      optimizedWaypoints.push(finalDestination);

      // Extract steps
      const steps = leg.steps.map(step => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
        location: {
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        },
      }));

      // Calculate totals
      const totalDistanceMeters = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
      const totalDurationSeconds = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

      this.metrics.observe('google_maps_route_optimization_latency_seconds', (Date.now() - start) / 1000);

      return {
        optimizedWaypoints,
        totalDistanceMeters,
        totalDurationSeconds,
        polyline: route.overview_polyline.points,
        steps,
      };
    } catch (err: any) {
      this.metrics.increment('google_maps_route_optimization_failed_total');
      this.logger.error(`Route optimization error: ${err.message}`, err.stack);
      
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not optimize route');
    }
  }
}