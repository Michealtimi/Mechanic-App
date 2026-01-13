/* eslint-disable prettier/prettier */
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { GoogleMapsService, Location } from './google-maps.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);
  private readonly BUFFER_PERCENTAGE = 0.20; // 20% extra time for traffic

  constructor(
    private readonly prisma: PrismaService,
    private readonly maps: GoogleMapsService,
    private readonly notification: NotificationGateway,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * 1. INITIALIZE SLA
   * Creates the baseline record when a booking is created.
   */
  async createOrPatchSlaRecord(bookingId: string, data: { status: string }) {
    return this.prisma.sLARecord.upsert({
      where: { bookingId },
      update: { status: data.status },
      create: { 
        bookingId, 
        status: data.status,
        startTime: new Date() 
      },
    });
  }

  /**
   * 2. COMPUTE ETA & SET DEADLINE
   * Called when mechanic accepts. Sets the "expectedArrivalAt" timestamp.
   */
  async computeSlaEta(bookingId: string, origin: Location, destination: Location) {
    try {
      const { durationSeconds } = await this.maps.getDistanceAndDuration(origin, destination);
      
      // Add a 20% buffer for traffic/parking
      const bufferedDuration = durationSeconds * (1 + this.BUFFER_PERCENTAGE);
      const expectedArrivalAt = new Date(Date.now() + bufferedDuration * 1000);

      const sla = await this.prisma.sLARecord.update({
        where: { bookingId },
        data: {
          expectedDuration: Math.round(bufferedDuration),
          expectedArrivalAt,
          status: 'IN_TRANSIT',
        },
      });

      this.logger.log(`SLA set for Booking ${bookingId}. Expected at: ${expectedArrivalAt.toISOString()}`);
      return sla;
    } catch (error) {
      this.logger.error(`SLA ETA calculation failed for ${bookingId}`, error.stack);
      // Fallback: Set a default 60-minute SLA if Maps fails
      return this.prisma.sLARecord.update({
        where: { bookingId },
        data: { expectedArrivalAt: new Date(Date.now() + 3600 * 1000), status: 'IN_TRANSIT' }
      });
    }
  }

  /**
   * 3. CHECK FOR BREACHES
   * This would be called by a Cron Job or a background worker every minute.
   */
  async checkAndAlertBreaches() {
    const overdueBookings = await this.prisma.sLARecord.findMany({
      where: {
        status: 'IN_TRANSIT',
        expectedArrivalAt: { lt: new Date() }, // Time has passed
        isBreached: false, // Not yet flagged
      },
      include: { booking: { include: { customer: true, mechanic: true } } }
    });

    for (const sla of overdueBookings) {
      await this.prisma.$transaction(async (tx) => {
        // Mark as breached
        await tx.sLARecord.update({
          where: { id: sla.id },
          data: { isBreached: true }
        });

        // 🚨 ALERT: Notify Customer and Support
        await this.notification.emitSlaBreach(sla.booking.customerId, {
          message: `Your mechanic is running late. We are tracking their progress.`,
          bookingId: sla.bookingId
        });

        this.metrics.increment('sla_breaches_total');
        this.logger.warn(`SLA BREACH: Mechanic ${sla.booking.mechanicId} is late for Booking ${sla.bookingId}`);
      });
    }
  }

  /**
   * 4. COMPLETE SLA
   * Finalizes the record and calculates performance variance.
   */
  async completeSla(bookingId: string, actualDurationMs: number) {
    const actualSeconds = Math.round(actualDurationMs / 1000);
    
    const sla = await this.prisma.sLARecord.findUnique({ where: { bookingId } });
    const variance = sla ? actualSeconds - (sla.expectedDuration || 0) : 0;

    return this.prisma.sLARecord.update({
      where: { bookingId },
      data: {
        actualDuration: actualSeconds,
        endTime: new Date(),
        status: 'COMPLETED',
        varianceSeconds: variance,
      },
    });
  }
}