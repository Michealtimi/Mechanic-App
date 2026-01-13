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
import { BookingStatus, Role, PaymentStatus } from '@prisma/client';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { SlaService } from 'src/sla/sla.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PaymentsService } from 'src/payments/payments.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMaps: GoogleMapsService,
    private readonly slaService: SlaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly paymentService: PaymentsService,
  ) {}

  /**
   * 1️⃣ DISPATCH: Find/Assign a Mechanic & Start the Clock
   */
  async createDispatch(dto: CreateDispatchDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking || booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking not eligible for dispatch');
    }

    // Logic: If manual ID provided, use it; otherwise, find nearest online mechanic
    let mechanicId = dto.mechanicId;
    if (!mechanicId) {
      const nearest = await this.findNearestMechanic(booking.pickupLatitude, booking.pickupLongitude);
      mechanicId = nearest.id;
    }

    const mechanic = await this.prisma.user.findUnique({ where: { id: mechanicId } });
    
    // Calculate Travel & Check for Long ETA (>30 mins)
    const travel = await this.calculateTravelAndAlert(mechanic, booking);

    return await this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.create({
        data: {
          bookingId: booking.id,
          mechanicId,
          status: 'ASSIGNED',
          expiresAt: new Date(Date.now() + 5 * 60000), // 5 min window
        },
      });

      await this.slaService.createOrPatchSlaRecord(booking.id, {
        assignedAt: new Date(),
        expectedArrivalMs: travel.durationMs,
        distanceMeters: travel.distanceMeters,
      });

      await this.notificationGateway.emitDispatchAssigned(mechanicId, { 
        bookingId: booking.id, 
        etaMs: travel.durationMs 
      });

      return dispatch;
    });
  }

  /**
   * 2️⃣ ACCEPTANCE: Mechanic says "Yes"
   */
  async acceptDispatch(dispatchId: string, mechanicId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.update({
        where: { id: dispatchId },
        data: { status: 'ACCEPTED', acceptedAt: new Date() }
      });

      const booking = await tx.booking.update({
        where: { id: dispatch.bookingId },
        data: { status: BookingStatus.CONFIRMED, mechanicId }
      });

      await this.slaService.createOrPatchSlaRecord(booking.id, {
        mechanicAcceptedAt: new Date(),
        status: 'IN_TRANSIT'
      });

      await this.notificationGateway.emitDispatchAccepted(booking.id, mechanicId, booking.customerId);
      return { booking, dispatch };
    });
  }

  /**
   * 3️⃣ ARRIVAL: Mechanic reaches the customer
   */
  async mechanicArrived(bookingId: string) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS }
    });

    await this.slaService.createOrPatchSlaRecord(bookingId, {
      mechanicArrivedAt: new Date(),
      status: 'ARRIVED'
    });

    await this.notificationGateway.emitMechanicArrived(bookingId, booking.mechanicId);
    return booking;
  }

  /**
   * 4️⃣ COMPLETION: Job is done, money is handled
   */
  async completeBooking(bookingId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED }
      });

      await this.slaService.createOrPatchSlaRecord(bookingId, {
        completedAt: new Date(),
        status: 'COMPLETED'
      });

      return booking;
    });

    const slaReport = await this.slaService.getSla(bookingId);
    this.logger.log(`Job Done! Total Work Time: ${slaReport.metrics.totalJobMs}ms`);

    await this.notificationGateway.emitBookingCompleted(bookingId, result.mechanicId, result.customerId);
    return { result, metrics: slaReport.metrics };
  }

  /**
   * 5️⃣ CANCELLATION: Safety switch
   */
  async cancelBooking(bookingId: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
      if (!booking) throw new NotFoundException();

      // Refund if paid
      if (booking.payment?.status === PaymentStatus.SUCCESS) {
        await this.paymentService.refund(booking.payment.reference, booking.price, tx);
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED }
      });

      await this.slaService.createOrPatchSlaRecord(bookingId, { status: 'CANCELLED' });
      return updated;
    });
  }

  // --- HELPERS ---

  private async calculateTravelAndAlert(mechanic: any, booking: any) {
    const res = await this.googleMaps.getDistanceAndDuration(
      { lat: mechanic.currentLat, lng: mechanic.currentLng },
      { lat: booking.pickupLatitude, lng: booking.pickupLongitude }
    );

    if (res.durationSeconds > 1800) {
      await this.notificationGateway.emitBookingETALong(booking.id, res.durationSeconds);
    }
    return { distanceMeters: res.distanceMeters, durationMs: res.durationSeconds * 1000 };
  }

  private async findNearestMechanic(lat: number, lng: number) {
    const res = await this.prisma.$queryRaw<any[]>(`
      SELECT id FROM "User" WHERE "role" = 'MECHANIC' AND "mechanicOnlineStatus" = 'ONLINE'
      ORDER BY ST_Distance(ST_MakePoint("currentLng", "currentLat"), ST_MakePoint(${lng}, ${lat})) ASC LIMIT 1
    `);
    if (!res.length) throw new NotFoundException('No mechanics found');
    return res[0];
  }
}