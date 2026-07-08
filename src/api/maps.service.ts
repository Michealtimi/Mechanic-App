/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IMapsService,
  Location,
} from 'src/common/interfaces/maps-service.interface';

/**
 * Provider‑neutral maps service.
 *
 * - Uses OpenStreetMap/Nominatim style HTTP APIs for geocoding.
 * - Uses a Haversine fallback for distance/duration so the
 *   app works even without an external routing backend.
 *
 * You can later swap the internals to OSRM / OpenRouteService
 * without changing callers.
 */
@Injectable()
export class MapsService implements IMapsService {
  private readonly logger = new Logger(MapsService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Approximate distance/duration between two coordinates.
   * Distance: Haversine (metres)
   * Duration: assumes ~40km/h average city speed.
   */
  async getDistanceAndDuration(
    origin: Location,
    destination: Location,
  ): Promise<{ distanceMeters: number; durationSeconds: number }> {
    const distanceMeters = this.haversine(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
    );

    // Simple ETA model – replace with OSRM/OpenRouteService if needed
    const averageSpeedKmh = 40;
    const durationSeconds = Math.max(
      60,
      Math.round((distanceMeters / 1000 / averageSpeedKmh) * 3600),
    );

    return { distanceMeters, durationSeconds };
  }

  /**
   * Forward geocode using Nominatim (OpenStreetMap).
   *
   * NOTE: In production you should:
   * - Configure a proper base URL in config
   * - Set a custom User‑Agent / email per Nominatim policy
   */
  async geocodeAddress(address: string): Promise<Location> {
    const query = address.trim();
    if (!query) {
      throw new BadRequestException('Address is required');
    }

    try {
      const response = await firstValueFrom(
        this.http.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            limit: 1,
          },
          headers: {
            'User-Agent': 'mechanic-app-backend/1.0',
          },
        }),
      );

      const [result] = response.data || [];
      if (!result) {
        throw new BadRequestException(`Could not geocode address: ${address}`);
      }

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    } catch (err: any) {
      this.logger.error(`Geocoding error for "${address}": ${err.message}`, err.stack);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Could not geocode address');
    }
  }

  /**
   * Basic point‑to‑point route helper.
   * Currently reuses the Haversine + simple ETA model and returns
   * a minimal structure that callers (e.g. charging routes) can use.
   */
  async getRoute(origin: Location, destination: Location) {
    const { distanceMeters, durationSeconds } = await this.getDistanceAndDuration(
      origin,
      destination,
    );

    return {
      distanceMeters,
      durationSeconds,
      polyline: null,
      steps: [
        {
          distance: distanceMeters,
          duration: durationSeconds,
          instruction: 'Head towards destination',
          location: origin,
        },
      ],
    };
  }

  private haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // metres
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

