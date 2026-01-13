/* eslint-disable prettier/prettier */
import { 
  Injectable, 
  Logger, 
  InternalServerErrorException, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService, TransactionClient } from 'prisma/prisma.service';
import { BookingStatus, Role, DispatchStatus } from '@prisma/client';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { SlaService } from 'src/sla/sla.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMaps: GoogleMapsService,
    private readonly slaService: SlaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * CREATE OR AUTO-DISPATCH A BOOKING
   * Finds the best mechanic (Auto) or assigns one (Manual).
   */
  async createDispatch(dto: CreateDispatchDto, createdBy: string) {
    this.logger.log(`Creating dispatch for booking: ${dto.bookingId}`);

    // 1️⃣ Validate Booking Eligibility
    const booking = await this.validateBookingForDispatch(dto.bookingId);

    // 2️⃣ Mechanic Selection Logic
    let mechanicId = dto.mechanicId;
    let metrics = { distanceMeters: 0, durationMs: 0 };

    if (!mechanicId) {
      // AUTO-DISPATCH MODE
      const nearest = await this.findNearestAvailableMechanic(booking.pickupLatitude, booking.pickupLongitude);
      mechanicId = nearest.id;
      metrics = await this.getTravelMetrics(nearest, booking);
    } else {
      // MANUAL MODE
      const mechanic = await this.validateMechanic(mechanicId);
      metrics = await this.getTravelMetrics(mechanic, booking);
    }

    try {
      // 3️⃣ Atomic Transaction: Dispatch + SLA
      const result = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const dispatch = await tx.dispatch.create({
          data: {
            bookingId: booking.id,
            mechanicId,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 5 * 60000), // Default 5 min expiry
            status: 'ASSIGNED',
          },
        });

        const sla = await this.slaService.createOrPatchSlaRecord(booking.id, {
          assignedAt: new Date(),
          distanceMeters: metrics.distanceMeters,
          expectedArrivalMs: metrics.durationMs,
          status: 'PENDING'
        });

        return { dispatch, sla };
      });

      // 4️⃣ Real-time Notifications
      await this.broadcastDispatch(mechanicId, booking.id, result.dispatch.id, metrics);
      
      return result;
    } catch (err) {
      this.logger.error(`Dispatch Transaction Failed: ${err.message}`);
      throw new InternalServerErrorException('Critical failure during dispatch creation');
    }
  }

  /**
   * ACCEPT DISPATCH
   * Transitions from ASSIGNED -> ACCEPTED and updates Booking to CONFIRMED.
   */
  async acceptDispatch(dispatchId: string, mechanicId: string) {
    const dispatch = await this.prisma.dispatch.findUnique({ where: { id: dispatchId } });
    
    if (!dispatch) throw new NotFoundException('Dispatch offer not found');
    if (dispatch.mechanicId !== mechanicId) throw new ForbiddenException('This offer was not sent to you');
    if (dispatch.expiresAt && dispatch.expiresAt < new Date()) throw new BadRequestException('Offer expired');
    if (dispatch.status !== 'ASSIGNED') throw new BadRequestException('Offer no longer valid');

    return await this.prisma.$transaction(async (tx) => {
      const updatedD = await tx.dispatch.update({
        where: { id: dispatchId },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      const updatedB = await tx.booking.update({
        where: { id: dispatch.bookingId },
        data: { status: BookingStatus.CONFIRMED, mechanicId },
      });

      await this.slaService.createOrPatchSlaRecord(dispatch.bookingId, { 
        mechanicAcceptedAt: new Date(),
        status: 'IN_TRANSIT'
      });

      await this.notificationGateway.emitDispatchAccepted(dispatch.bookingId, mechanicId, updatedB.customerId);
      
      return { dispatch: updatedD, booking: updatedB };
    });
  }

  // --- PRIVATE HELPERS ---

  private async validateBookingForDispatch(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be dispatched in current state');
    }
    return booking;
  }

  private async findNearestAvailableMechanic(lat: number, lng: number) {
    const res = await this.prisma.$queryRaw<any[]>(`
      SELECT "id", "currentLat", "currentLng" FROM "User"
      WHERE "role" = 'MECHANIC' AND "mechanicOnlineStatus" = 'ONLINE' AND "isAvailableForJobs" = true
      ORDER BY (ST_Distance(ST_MakePoint("currentLng", "currentLat"), ST_MakePoint(${lng}, ${lat}))) ASC
      LIMIT 1
    `);
    if (!res || res.length === 0) throw new NotFoundException('No mechanics online nearby');
    return res[0];
  }

  private async getTravelMetrics(mechanic: any, booking: any) {
    if (!mechanic.currentLat || !booking.pickupLatitude) return { distanceMeters: 0, durationMs: 0 };
    const res = await this.googleMaps.getDistanceAndDuration(
      { lat: mechanic.currentLat, lng: mechanic.currentLng },
      { lat: booking.pickupLatitude, lng: booking.pickupLongitude }
    );
    return { distanceMeters: res.distanceMeters, durationMs: res.durationSeconds * 1000 };
  }

  private async validateMechanic(id: string) {
    const m = await this.prisma.user.findUnique({ where: { id, role: Role.MECHANIC } });
    if (!m) throw new NotFoundException('Selected mechanic is invalid');
    return m;
  }

  private async broadcastDispatch(mId: string, bId: string, dId: string, metrics: any) {
    await this.notificationGateway.emitDispatchAssigned(mId, { 
      bookingId: bId, dispatchId: dId, etaMs: metrics.durationMs 
    });
    await this.notificationGateway.emitBookingAssigned(bId, mId, metrics.durationMs, metrics.distanceMeters);
  }
}