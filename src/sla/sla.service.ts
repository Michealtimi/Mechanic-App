/* eslint-disable prettier/prettier */
import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Location, IMapsService, MAPS_SERVICE_TOKEN } from 'src/common/interfaces/maps-service.interface';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { MetricsService } from 'src/metrics/metrics.service';
import { SlaStatus, Prisma } from '@prisma/client';
import { SlaDashboardDto, SlaAnalyticsDto, SlaPenaltyDto } from './dto/sla.dto';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);
  private readonly BUFFER_PERCENTAGE = 0.20; // 20% extra time for traffic

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAPS_SERVICE_TOKEN) private readonly maps: IMapsService,
    private readonly notification: NotificationGateway,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * 1. INITIALIZE SLA
   * Creates the baseline record when a booking is created.
   */
  async createOrPatchSlaRecord(bookingId: string, data: { status?: SlaStatus }) {
    return this.prisma.slaRecord.upsert({
      where: { bookingId },
      update: { status: data.status },
      create: { 
        bookingId, 
        status: data.status || 'PENDING',
      },
    });
  }

  /**
   * Get SLA record by booking ID
   */
  async getSla(bookingId: string) {
    return this.prisma.slaRecord.findUnique({
      where: { bookingId },
      include: { booking: true },
    });
  }

  /**
   * 2. COMPUTE ETA & SET DEADLINE
   * Called when mechanic accepts. Sets the "expectedArrivalMs" field.
   */
  async computeSlaEta(bookingId: string, origin: Location, destination: Location) {
    try {
      const { durationSeconds } = await this.maps.getDistanceAndDuration(origin, destination);
      
      // Add a 20% buffer for traffic/parking
      const bufferedDurationMs = Math.round(durationSeconds * (1 + this.BUFFER_PERCENTAGE) * 1000);

      const sla = await this.prisma.slaRecord.update({
        where: { bookingId },
        data: {
          expectedArrivalMs: bufferedDurationMs,
          status: 'PENDING',
        },
      });

      this.logger.log(`SLA set for Booking ${bookingId}. Duration: ${bufferedDurationMs}ms`);
      return sla;
    } catch (error) {
      this.logger.error(`SLA ETA calculation failed for ${bookingId}`, error.stack);
      // Fallback: Set a default 60-minute SLA if Maps fails
      return this.prisma.slaRecord.update({
        where: { bookingId },
        data: { 
          expectedArrivalMs: 3600000, // 60 minutes
          status: 'PENDING'
        }
      });
    }
  }

  /**
   * 3. CHECK FOR BREACHES
   * Designed to be called by a Cron Job.
   */
  async checkAndAlertBreaches() {
    const pendingSlas = await this.prisma.slaRecord.findMany({
      where: { status: 'PENDING' },
      include: { 
        booking: { 
          include: { 
            customer: true, 
            segments: { include: { mechanic: true } },
          } 
        } 
      },
    });

    const now = Date.now();
    for (const sla of pendingSlas) {
      if (!sla.expectedArrivalMs) continue;

      const expectedArrivalTime = new Date(sla.createdAt).getTime() + sla.expectedArrivalMs;
      const isBreached = now > expectedArrivalTime;

      if (isBreached) {
        await this.prisma.$transaction(async (tx) => {
          await tx.slaRecord.update({
            where: { id: sla.id },
            data: { 
              status: 'BREACHED',
              breachReason: 'Mechanic did not arrive within expected time',
            },
          });

          // Notify Customer
          await this.notification.emitSlaBreach(sla.booking.customerId, {
            message: `Your mechanic is running late. We are tracking their progress.`,
            bookingId: sla.bookingId,
          });

          this.metrics.increment('sla_breaches_total');
          this.logger.warn(`SLA BREACH: Booking ${sla.bookingId}`);
        });
      }
    }
  }

  /**
   * Mark SLA as MET when mechanic arrives on time
   */
  async markSlaMet(bookingId: string) {
    const sla = await this.prisma.slaRecord.findUnique({ where: { bookingId } });

    if (!sla) throw new BadRequestException('SLA record not found');
    if (sla.status === 'BREACHED') throw new BadRequestException('SLA already breached');

    return this.prisma.slaRecord.update({
      where: { bookingId },
      data: { status: 'MET' },
    });
  }

  /**
   * Apply penalty for SLA breach
   */
  async applyPenalty(bookingId: string, penaltyAmount: number, reason: string): Promise<SlaPenaltyDto> {
    const sla = await this.prisma.slaRecord.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            segments: { include: { mechanic: true } },
          },
        },
      },
    });

    if (!sla || sla.status !== 'BREACHED') {
      throw new BadRequestException('SLA not breached or not found');
    }

    const mechanic = sla.booking.segments[0]?.mechanic;
    if (!mechanic) throw new BadRequestException('No mechanic assigned');

    this.logger.warn(`Applying penalty of ${penaltyAmount} to mechanic ${mechanic.id}`);

    return {
      amount: penaltyAmount,
      reason,
      mechanicId: mechanic.id,
    };
  }

  /**
   * Get SLA dashboard statistics
   */
  async getDashboardStats(tenantId?: string): Promise<SlaDashboardDto> {
    const where: Prisma.SlaRecordWhereInput = {};
    if (tenantId) {
      where.booking = { orgId: tenantId };
    }

    const slas = await this.prisma.slaRecord.findMany({
      where,
      include: { booking: true },
    });

    const total = slas.length;
    const met = slas.filter((s) => s.status === 'MET').length;
    const breached = slas.filter((s) => s.status === 'BREACHED').length;
    const pending = slas.filter((s) => s.status === 'PENDING').length;

    const complianceRate = total > 0 ? (met / total) * 100 : 0;

    const breachedSlas = slas.filter((s) => s.status === 'BREACHED' && s.expectedArrivalMs);
    let averageBreachTime = 0;
    if (breachedSlas.length > 0) {
      const totalBreachTime = breachedSlas.reduce((sum, s) => {
        const expectedTime = new Date(s.createdAt).getTime() + (s.expectedArrivalMs || 0);
        const actualTime = s.updatedAt.getTime();
        return sum + (actualTime - expectedTime) / (1000 * 60);
      }, 0);
      averageBreachTime = totalBreachTime / breachedSlas.length;
    }

    const breachesByReason = breachedSlas.reduce((acc, s) => {
      const reason = s.breachReason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      met,
      breached,
      pending,
      complianceRate: Number(complianceRate.toFixed(2)),
      averageBreachTime: Number(averageBreachTime.toFixed(2)),
      breachesByReason,
    };
  }

  /**
   * Get SLA analytics
   */
  async getAnalytics(startDate?: Date, endDate?: Date, tenantId?: string): Promise<SlaAnalyticsDto> {
    const where: Prisma.SlaRecordWhereInput = {};
    if (tenantId) where.booking = { orgId: tenantId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const slas = await this.prisma.slaRecord.findMany({
      where,
      include: { booking: true },
    });

    const byStatus = slas.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complianceByPeriod = this.groupComplianceByPeriod(slas);

    const slasWithTime = slas.filter((s) => s.expectedArrivalMs);
    const averageResponseTime =
      slasWithTime.length > 0
        ? slasWithTime.reduce((sum, s) => sum + (s.expectedArrivalMs || 0) / (1000 * 60), 0) /
          slasWithTime.length
        : 0;

    const totalBreaches = byStatus['BREACHED'] || 0;
    const breachRate = slas.length > 0 ? (totalBreaches / slas.length) * 100 : 0;

    return {
      byStatus,
      complianceByPeriod,
      averageResponseTime: Number(averageResponseTime.toFixed(2)),
      totalBreaches,
      breachRate: Number(breachRate.toFixed(2)),
    };
  }

  private groupComplianceByPeriod(
    slas: any[],
  ): Array<{ period: string; complianceRate: number; total: number }> {
    const periodMap = new Map<string, { met: number; total: number }>();

    slas.forEach((sla) => {
      const period = sla.createdAt.toISOString().substring(0, 7);
      const current = periodMap.get(period) || { met: 0, total: 0 };
      current.total++;
      if (sla.status === 'MET') current.met++;
      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      complianceRate: data.total > 0 ? (data.met / data.total) * 100 : 0,
      total: data.total,
    }));
  }

  /**
   * 4. COMPLETE SLA
   */
  async completeSla(bookingId: string) {
    const sla = await this.prisma.slaRecord.findUnique({ where: { bookingId } });
    
    if (!sla) throw new BadRequestException('SLA record not found');

    if (sla.status === 'PENDING') {
      return this.prisma.slaRecord.update({
        where: { bookingId },
        data: { status: 'MET' },
      });
    }

    return sla;
  }
}