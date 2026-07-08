/* eslint-disable prettier/prettier */
import {
    Injectable,
    Logger,
    InternalServerErrorException,
    NotFoundException,
    BadRequestException,
    ForbiddenException
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, BookingStatus, Role, DispatchStatus } from '@prisma/client';
import { CreateDispatchDto } from './dto/dispatch.dto';
import { Inject } from '@nestjs/common';
import {
  IMapsService,
  MAPS_SERVICE_TOKEN,
} from 'src/common/interfaces/maps-service.interface';
import { SlaService } from 'src/sla/sla.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { GeoService } from 'src/location/geo.service';
import { PlatformConfigService } from 'src/config/platform-config.service';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAPS_SERVICE_TOKEN) private readonly maps: IMapsService,
    private readonly slaService: SlaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly geoService: GeoService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  /**
   * CREATE OR AUTO-DISPATCH A BOOKING
   * Invisible Foreman: Auto = offer to 3 closest within radius; first to accept wins.
   * Manual = single mechanic assignment.
   */
  async createDispatch(dto: CreateDispatchDto, createdBy: string) {
    this.logger.log(`Creating dispatch for booking: ${dto.bookingId}`);

    const booking = await this.validateBookingForDispatch(dto.bookingId);

    if (dto.mechanicId) {
      // MANUAL MODE: single mechanic
      const mechanic = await this.validateMechanic(dto.mechanicId);
      const metrics = await this.getTravelMetrics(mechanic, booking);
      const timeoutMs = await this.platformConfig.getDispatchOfferTimeoutMs();
      const result = await this.prisma.$transaction(async (tx) => {
        const dispatch = await tx.dispatch.create({
          data: {
            bookingId: booking.id,
            mechanicId: dto.mechanicId!,
            status: DispatchStatus.OFFERED,
            expiresAt: new Date(Date.now() + timeoutMs),
          },
        });
        await this.slaService.createOrPatchSlaRecord(booking.id, { status: 'PENDING' });
        return { dispatch, sla: { status: 'PENDING' } };
      });
      await this.broadcastDispatch(dto.mechanicId, booking.id, result.dispatch.id, metrics);
      return result;
    }

    // AUTO-DISPATCH: offer to N closest within radius (Invisible Foreman: 3 first)
    const radiusKm = await this.platformConfig.getDispatchRadiusKm();
    const firstWaveSize = await this.platformConfig.getDispatchFirstWaveSize();
    const timeoutMs = await this.platformConfig.getDispatchOfferTimeoutMs();

    const mechanics = await this.geoService.findNearbyMechanics(
      Number(booking.pickupLatitude),
      Number(booking.pickupLongitude),
      radiusKm,
    );
    const alreadyOffered = await this.prisma.dispatch.findMany({
      where: { bookingId: booking.id },
      select: { mechanicId: true },
    });
    const offeredIds = new Set(alreadyOffered.map((d) => d.mechanicId));
    const available = mechanics.filter((m: any) => !offeredIds.has(m.id)).slice(0, firstWaveSize);

    if (available.length === 0) {
      throw new NotFoundException('No mechanics online nearby within radius');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const dispatches: any[] = [];
        for (const mechanic of available) {
          const d = await tx.dispatch.create({
            data: {
              bookingId: booking.id,
              mechanicId: mechanic.id,
              status: DispatchStatus.OFFERED,
              expiresAt: new Date(Date.now() + timeoutMs),
            },
          });
          dispatches.push({ dispatch: d, mechanic });
        }
        await this.slaService.createOrPatchSlaRecord(booking.id, { status: 'PENDING' });
        return dispatches;
      });

      for (const { dispatch, mechanic } of result) {
        const metrics = await this.getTravelMetrics(mechanic, booking);
        await this.broadcastDispatch(mechanic.id, booking.id, dispatch.id, metrics);
      }

      return { dispatches: result.map((r) => r.dispatch), sla: { status: 'PENDING' } };
    } catch (err: any) {
      this.logger.error(`Dispatch Transaction Failed: ${err.message}`);
      throw new InternalServerErrorException('Critical failure during dispatch creation');
    }
  }

  /**
   * ACCEPT DISPATCH
   * First-to-accept wins: transition OFFERED -> ACCEPTED, cancel other offers for this booking.
   */
  async acceptDispatch(dispatchId: string, mechanicId: string) {
    const dispatch = await this.prisma.dispatch.findUnique({ where: { id: dispatchId } });

    if (!dispatch) throw new NotFoundException('Dispatch offer not found');
    if (dispatch.mechanicId !== mechanicId) throw new ForbiddenException('This offer was not sent to you');
    if (dispatch.status !== DispatchStatus.OFFERED) throw new BadRequestException('Offer no longer valid');

    return await this.prisma.$transaction(async (tx) => {
      const updatedD = await tx.dispatch.update({
        where: { id: dispatchId },
        data: { status: DispatchStatus.ACCEPTED },
      });

      await tx.booking.update({
        where: { id: dispatch.bookingId },
        data: { status: BookingStatus.CONFIRMED, mechanicId },
      });

      // Cancel other offers for this booking (job taken)
      await tx.dispatch.updateMany({
        where: {
          bookingId: dispatch.bookingId,
          id: { not: dispatchId },
          status: DispatchStatus.OFFERED,
        },
        data: { status: DispatchStatus.CANCELLED },
      });

      await this.slaService.createOrPatchSlaRecord(dispatch.bookingId, { status: 'PENDING' });
      await this.notificationGateway.emitToUser(mechanicId, 'dispatch.accepted', {
        bookingId: dispatch.bookingId,
        dispatchId,
      });
      const booking = await tx.booking.findUnique({ where: { id: dispatch.bookingId } });
      return { dispatch: updatedD, booking };
    });
  }

  /**
   * REJECT DISPATCH — mechanic declines the offer.
   */
  async rejectDispatch(dispatchId: string, mechanicId: string, reason?: string) {
    const dispatch = await this.prisma.dispatch.findUnique({ where: { id: dispatchId } });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.mechanicId !== mechanicId) throw new ForbiddenException('This offer was not sent to you');
    if (dispatch.status !== DispatchStatus.OFFERED) throw new BadRequestException('Offer no longer valid');

    const updated = await this.prisma.dispatch.update({
      where: { id: dispatchId },
      data: { status: DispatchStatus.REJECTED },
    });
    return { dispatch: updated };
  }

  /**
   * Invisible Foreman: Run timeout round — cancel expired offers, create 5 new offers for same booking.
   * Call from cron every e.g. 1 min.
   */
  async runOfferTimeoutRound(): Promise<{ processed: number; newOffers: number }> {
    const timeoutMs = await this.platformConfig.getDispatchOfferTimeoutMs();
    const deadline = new Date(Date.now() - timeoutMs);

    const expired = await this.prisma.dispatch.findMany({
      where: { status: DispatchStatus.OFFERED, expiresAt: { lt: deadline } },
      include: { booking: true },
    });

    const bookingIds = [...new Set(expired.map((d) => d.bookingId))];
    let newOffers = 0;

    for (const bookingId of bookingIds) {
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.status !== BookingStatus.PENDING) continue;

      await this.prisma.$transaction(async (tx) => {
        await tx.dispatch.updateMany({
          where: { bookingId, status: DispatchStatus.OFFERED, expiresAt: { lt: deadline } },
          data: { status: DispatchStatus.TIMEOUT },
        });
      });

      const radiusKm = await this.platformConfig.getDispatchRadiusKm();
      const secondWaveSize = await this.platformConfig.getDispatchSecondWaveSize();
      const mechanics = await this.geoService.findNearbyMechanics(
        Number(booking.pickupLatitude),
        Number(booking.pickupLongitude),
        radiusKm,
      );
      const alreadyOffered = await this.prisma.dispatch.findMany({
        where: { bookingId },
        select: { mechanicId: true },
      });
      const offeredIds = new Set(alreadyOffered.map((d) => d.mechanicId));
      const available = mechanics.filter((m: any) => !offeredIds.has(m.id)).slice(0, secondWaveSize);

      if (available.length === 0) continue;

      const timeoutMsVal = await this.platformConfig.getDispatchOfferTimeoutMs();
      const created = await this.prisma.$transaction(async (tx) => {
        const out: any[] = [];
        for (const mechanic of available) {
          const d = await tx.dispatch.create({
            data: {
              bookingId,
              mechanicId: mechanic.id,
              status: DispatchStatus.OFFERED,
              expiresAt: new Date(Date.now() + timeoutMsVal),
            },
          });
          out.push({ dispatch: d, mechanic });
        }
        return out;
      });

      for (const { dispatch, mechanic } of created) {
        const metrics = await this.getTravelMetrics(mechanic, booking);
        await this.broadcastDispatch(mechanic.id, bookingId, dispatch.id, metrics);
      }
      newOffers += created.length;
    }

    return { processed: bookingIds.length, newOffers };
  }

  // --- PRIVATE HELPERS ---

  private async validateBookingForDispatch(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Booking cannot be dispatched in current state');
    }
    return booking;
  }

  private async getTravelMetrics(mechanic: any, booking: any) {
    if (!mechanic.currentLat || !booking.pickupLatitude) return { distanceMeters: 0, durationMs: 0 };
    const res = await this.maps.getDistanceAndDuration(
      { lat: Number(mechanic.currentLat), lng: Number(mechanic.currentLng) },
      { lat: Number(booking.pickupLatitude), lng: Number(booking.pickupLongitude) }
    );
    return { distanceMeters: res.distanceMeters, durationMs: res.durationSeconds * 1000 };
  }

  private async validateMechanic(id: string) {
    const m = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!m || m.role !== Role.MECHANIC) throw new NotFoundException('Selected mechanic is invalid');
    return m;
  }

  private async broadcastDispatch(mId: string, bId: string, dId: string, metrics: any) {
    // Use emitToUser for dispatch notifications
    await this.notificationGateway.emitToUser(mId, 'dispatch.assigned', {
      bookingId: bId, dispatchId: dId, etaMs: metrics.durationMs
    });
    // Emit booking assigned event
    await this.notificationGateway.emitToUser(mId, 'booking.assigned', {
      bookingId: bId,
      mechanicId: mId,
      etaMs: metrics.durationMs,
      distanceMeters: metrics.distanceMeters,
    });
  }

  /**
   * Get available mechanics for map/list (for GET /dispatch/available-mechanics).
   */
  async getAvailableMechanics(lat: number, lng: number, radiusKm = 10) {
    const mechanics = await this.geoService.findNearbyMechanics(lat, lng, radiusKm);
    return mechanics.map((m: any) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      location: { lat: Number(m.currentLat ?? 0), lng: Number(m.currentLng ?? 0) },
      status: 'available',
      distance: m.distance,
      isEvSpecialist: m.isEvSpecialist,
      serviceRadiusKm: m.serviceRadiusKm,
    }));
  }

  /**
   * Get dispatch analytics
   */
  async getAnalytics(startDate?: Date, endDate?: Date, tenantId?: string) {
    const where: any = {};
    if (tenantId) {
      where.booking = { tenantId };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const dispatches = await this.prisma.dispatch.findMany({
      where,
      include: { booking: true },
    });

    const total = dispatches.length;
    const accepted = dispatches.filter((d) => d.status === DispatchStatus.ACCEPTED).length;
    const rejected = dispatches.filter((d) => d.status === DispatchStatus.REJECTED).length;
    const timeout = dispatches.filter((d) => d.status === DispatchStatus.TIMEOUT).length;
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    // Calculate average response time
    const acceptedDispatches = dispatches.filter((d) => d.status === DispatchStatus.ACCEPTED);
    let averageResponseTime = 0;
    // Note: Would need acceptedAt field in Dispatch model for accurate calculation

    // By status
    const byStatus = dispatches.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By period
    const byPeriod = this.groupDispatchesByPeriod(dispatches);

    return {
      total,
      accepted,
      rejected,
      timeout,
      acceptanceRate: Number(acceptanceRate.toFixed(2)),
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      byStatus,
      byPeriod,
    };
  }

  /**
   * Predict mechanic availability
   */
  async predictMechanicAvailability(mechanicId: string): Promise<{
    mechanicId: string;
    availabilityScore: number;
    isAvailable: boolean;
    predictedAvailable: boolean;
    activeBookings: number;
    averageCompletionTime: number;
  }> {
    const mechanic = await this.prisma.user.findUnique({
      where: { id: mechanicId },
    });

    if (!mechanic || mechanic.role !== Role.MECHANIC) {
      throw new NotFoundException('Mechanic not found');
    }

    // Get active bookings
    const activeBookings = await this.prisma.bookingSegment.count({
      where: {
        mechanicId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'ASSIGNED'] },
      },
    });

    // Get completed bookings for average time
    const completedBookings = await this.prisma.bookingSegment.findMany({
      where: {
        mechanicId,
        status: 'COMPLETED',
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const averageCompletionTime =
      completedBookings.length > 0
        ? completedBookings.reduce((sum, b) => {
            const duration = b.updatedAt.getTime() - b.createdAt.getTime();
            return sum + duration / (1000 * 60); // Convert to minutes
          }, 0) / completedBookings.length
        : 0;

    // Calculate availability score (0-100)
    const isAvailable = mechanic.mechanicOnlineStatus === 'ONLINE' && mechanic.isAvailableForJobs;
    const availabilityScore = isAvailable && activeBookings < 3 ? 100 : Math.max(0, 100 - activeBookings * 20);
    const predictedAvailable = availabilityScore > 50;

    return {
      mechanicId,
      availabilityScore: Number(availabilityScore.toFixed(2)),
      isAvailable: !!isAvailable,
      predictedAvailable,
      activeBookings,
      averageCompletionTime: Number(averageCompletionTime.toFixed(2)),
    };
  }

  /**
   * Improved auto-dispatch with bidding system
   */
  async createDispatchWithBidding(bookingId: string, maxBids: number = 3) {
    const booking = await this.validateBookingForDispatch(bookingId);

    // Find multiple nearest mechanics
    const nearestMechanics = await this.findNearestAvailableMechanics(
      Number(booking.pickupLatitude),
      Number(booking.pickupLongitude),
      maxBids,
    );

    const timeoutMs = await this.platformConfig.getDispatchOfferTimeoutMs();
    // Create dispatch offers for each mechanic
    const dispatchOffers = await Promise.all(
      nearestMechanics.map(async (mechanic) => {
        const metrics = await this.getTravelMetrics(mechanic, booking);
        const dispatch = await this.prisma.dispatch.create({
          data: {
            bookingId,
            mechanicId: mechanic.id,
            status: DispatchStatus.OFFERED,
            expiresAt: new Date(Date.now() + timeoutMs),
          },
        });

        // Notify mechanic of dispatch offer
        await this.notificationGateway.emitToUser(mechanic.id, 'dispatch.offer', {
          bookingId,
          dispatchId: dispatch.id,
          etaMs: metrics.durationMs,
          distanceMeters: metrics.distanceMeters,
        });

        return dispatch;
      }),
    );

    return dispatchOffers;
  }

  private async findNearestAvailableMechanics(lat: number, lng: number, limit: number) {
    const res = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT "id", "currentLat", "currentLng" FROM "User"
        WHERE "role" = 'MECHANIC' AND "mechanicOnlineStatus" = 'ONLINE' AND "isAvailableForJobs" = true
        ORDER BY (ST_Distance(ST_MakePoint("currentLng", "currentLat"), ST_MakePoint(${lng}, ${lat}))) ASC
        LIMIT ${limit}
      `
    );
    if (!res || res.length === 0) throw new NotFoundException('No mechanics online nearby');
    return res;
  }

  private groupDispatchesByPeriod(dispatches: any[]): Array<{
    period: string;
    count: number;
    acceptanceRate: number;
  }> {
    const periodMap = new Map<string, { total: number; accepted: number }>();

    dispatches.forEach((dispatch) => {
      const period = dispatch.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = periodMap.get(period) || { total: 0, accepted: 0 };
      current.total++;
      if (dispatch.status === DispatchStatus.ACCEPTED) {
        current.accepted++;
      }
      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      count: data.total,
      acceptanceRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0,
    }));
  }
}