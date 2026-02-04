/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { User, Role, Prisma } from '@prisma/client';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { GoogleMapsService } from 'src/api/google-maps.service';

interface MechanicWithDistance extends User {
  distance: number;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly googleMaps: GoogleMapsService,
  ) {}

  /**
   * Updates mechanic location and broadcasts to active subscribers.
   */
  async updateMechanicLocation(mechanicId: string, lat: number, lng: number): Promise<User> {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid coordinates.');
    }

    try {
      // Use atomic update to save a DB roundtrip
      const mechanic = await this.prisma.user.update({
        where: { id: mechanicId },
        data: { currentLat: lat, currentLng: lng },
      });

      if (mechanic.role !== Role.MECHANIC) {
        throw new BadRequestException('User is not a mechanic.');
      }

      // 📡 Real-time broadcast for map tracking
      this.notificationGateway.emitLocationUpdate(mechanicId, { lat, lng });

      return mechanic;
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundException('Mechanic not found.');
      this.logger.error(`Location update failed: ${err.message}`);
      throw new InternalServerErrorException('Failed to update location.');
    }
  }

  /**
   * Finds mechanics nearby using an optimized Haversine SQL query.
   * FIX: Uses Prisma.sql to prevent SQL Injection and adds a Bounding Box.
   */
  async findNearbyMechanics(lat: number, lng: number, radiusKm: number = 10): Promise<MechanicWithDistance[]> {
    this.validateInputs(lat, lng, radiusKm);

    try {
      /**
       * 🚀 PRODUCTION OPTIMIZATION: Bounding Box
       * We calculate a square around the user first. SQL can use indexes on 
       * Lat/Lng columns to ignore 99% of the earth before doing heavy math.
       */
      const latDiff = radiusKm / 111; // 1 degree lat ≈ 111km
      const lngDiff = radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));

      const minLat = lat - latDiff;
      const maxLat = lat + latDiff;
      const minLng = lng - lngDiff;
      const maxLng = lng + lngDiff;

      // Use Prisma.sql tag for safe parameterization
      const mechanics = await this.prisma.$queryRaw<MechanicWithDistance[]>(Prisma.sql`
        SELECT *, (
          6371 * acos(
            cos(radians(${lat})) * cos(radians("currentLat")) *
            cos(radians("currentLng") - radians(${lng})) +
            sin(radians(${lat})) * sin(radians("currentLat"))
          )
        ) AS distance
        FROM "User"
        WHERE "role" = ${Role.MECHANIC}
          AND "currentLat" BETWEEN ${minLat} AND ${maxLat}
          AND "currentLng" BETWEEN ${minLng} AND ${maxLng}
        HAVING distance < ${radiusKm}
        ORDER BY distance ASC;
      `);

      return mechanics;
    } catch (error: any) {
      this.logger.error(`Search failed: ${error.message}`);
      throw new InternalServerErrorException('Search failed.');
    }
  }

  /** Cache TTL: entries older than this are treated as miss (30 days). */
  private static readonly GEOCODE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  /**
   * Geocode an address to coordinates. For GET /geo/geocode.
   * Cost recovery: check GeocodeCache first; call Google only on miss, then upsert cache.
   */
  async geocode(address: string): Promise<{ lat: number; lng: number; address: string; formattedAddress?: string }> {
    const key = address.trim().toLowerCase();
    if (!key) {
      throw new BadRequestException('Address is required');
    }

    const cached = await this.prisma.geocodeCache.findUnique({
      where: { address: key },
    });
    if (cached) {
      const age = Date.now() - cached.updatedAt.getTime();
      if (age < GeoService.GEOCODE_CACHE_TTL_MS) {
        return {
          lat: cached.lat,
          lng: cached.lng,
          address,
          formattedAddress: address,
        };
      }
    }

    const loc = await this.googleMaps.geocodeAddress(address);
    await this.prisma.geocodeCache.upsert({
      where: { address: key },
      create: { address: key, lat: loc.lat, lng: loc.lng },
      update: { lat: loc.lat, lng: loc.lng, updatedAt: new Date() },
    });
    return { ...loc, address, formattedAddress: address };
  }

  /**
   * Get distance and duration between two addresses. For GET /geo/distance.
   */
  async getDistance(
    originAddress: string,
    destinationAddress: string,
  ): Promise<{ distance: number; duration: number; eta?: string }> {
    const origin = await this.googleMaps.geocodeAddress(originAddress);
    const dest = await this.googleMaps.geocodeAddress(destinationAddress);
    const result = await this.googleMaps.getDistanceAndDuration(origin, dest);
    const durationMin = Math.round(result.durationSeconds / 60);
    const eta = new Date(Date.now() + result.durationSeconds * 1000).toISOString();
    return {
      distance: result.distanceMeters / 1000,
      duration: durationMin,
      eta,
    };
  }

  /**
   * Invisible Foreman: Haversine distance in metres between two points.
   * Used for geofence check (mechanic must be within X m of job to set IN_PROGRESS).
   */
  distanceMetres(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth radius in metres
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private validateInputs(lat: number, lng: number, radius: number) {
    if (isNaN(lat) || lat < -90 || lat > 90) throw new BadRequestException('Invalid lat');
    if (isNaN(lng) || lng < -180 || lng > 180) throw new BadRequestException('Invalid lng');
    if (isNaN(radius) || radius <= 0) throw new BadRequestException('Invalid radius');
  }
}