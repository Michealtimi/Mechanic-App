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

interface MechanicWithDistance extends User {
  distance: number;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
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

  private validateInputs(lat: number, lng: number, radius: number) {
    if (isNaN(lat) || lat < -90 || lat > 90) throw new BadRequestException('Invalid lat');
    if (isNaN(lng) || lng < -180 || lng > 180) throw new BadRequestException('Invalid lng');
    if (isNaN(radius) || radius <= 0) throw new BadRequestException('Invalid radius');
  }
}