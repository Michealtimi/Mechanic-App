import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import {
  ReportFilterDto,
  BookingAnalyticsDto,
  RevenueReportDto,
  MechanicPerformanceDto,
  OrganizationReportDto,
  TimeRange,
} from './dto/reporting.dto';
import { BookingStatus, PaymentStatus, SegmentStatus, VehicleStatus } from '@prisma/client';

import { Decimal } from 'decimal.js';

const REPORTING_ANALYTICS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(filter: ReportFilterDto): Promise<BookingAnalyticsDto> {
    const operation = 'Get booking analytics';
    this.logger.log(`[${operation}]`);

    const { startDate, endDate } = this.getDateRange(filter);
    const cacheKey = `reporting:analytics:${JSON.stringify({ ...filter, startDate: startDate.toISOString(), endDate: endDate.toISOString() })}`;
    const cached = this.cache.get<BookingAnalyticsDto>(cacheKey);
    if (cached) return cached;

    try {

      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (filter.organizationId) {
        where.organizationId = filter.organizationId;
      }
      if (filter.customerId) {
        where.customerId = filter.customerId;
      }
      if (filter.tenantId) {
        where.tenantId = filter.tenantId;
      }

      // Bounded analytics: use DB count/aggregate to avoid loading all rows
      const [totalBookings, completedBookings, cancelledBookings, pendingBookings, statusGroups, revenueResult, bookingsForMonth] = await Promise.all([
        this.prisma.booking.count({ where }),
        this.prisma.booking.count({ where: { ...where, status: BookingStatus.COMPLETED } }),
        this.prisma.booking.count({ where: { ...where, status: BookingStatus.CANCELLED } }),
        this.prisma.booking.count({ where: { ...where, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } } }),
        this.prisma.booking.groupBy({ by: ['status'], where, _count: { id: true } }),
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.SUCCESS,
            bookingSegment: {
              booking: { createdAt: where.createdAt, ...(filter.organizationId && { organizationId: filter.organizationId }), ...(filter.customerId && { customerId: filter.customerId }), ...(filter.tenantId && { tenantId: filter.tenantId }) },
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.booking.findMany({
          where,
          select: { createdAt: true, status: true, segments: { select: { payments: { select: { amount: true, status: true } } } } },
          take: 10000,
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const totalRevenue = new Decimal(revenueResult._sum.amount ?? 0);
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue.dividedBy(totalBookings).toNumber() : 0;
      const bookingsByStatus = statusGroups.reduce((acc, g) => {
        acc[g.status] = g._count.id;
        return acc;
      }, {} as Record<string, number>);
      const bookingsByMonth = this.groupByMonth(bookingsForMonth, startDate, endDate);

      const result: BookingAnalyticsDto = {
        totalBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        completionRate: Number(completionRate.toFixed(2)),
        cancellationRate: Number(cancellationRate.toFixed(2)),
        averageBookingValue: Number(averageBookingValue.toFixed(2)),
        totalRevenue: totalRevenue.toNumber(),
        bookingsByStatus,
        bookingsByMonth,
      };
      this.cache.set(cacheKey, result, REPORTING_ANALYTICS_CACHE_TTL_MS);
      return result;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get booking analytics');
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(filter: ReportFilterDto): Promise<RevenueReportDto> {
    const operation = 'Get revenue report';
    this.logger.log(`[${operation}]`);

    try {
      const { startDate, endDate } = this.getDateRange(filter);

      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: PaymentStatus.SUCCESS,
      };

      if (filter.organizationId) {
        where.booking = {
          organizationId: filter.organizationId,
        };
      }
      if (filter.tenantId) {
        where.booking = {
          ...where.booking,
          tenantId: filter.tenantId,
        };
      }

      const payments = await this.prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              organization: true,
            },
          },
        },
      });

      let totalRevenue = new Decimal(0);
      let platformFees = new Decimal(0);
      let mechanicEarnings = new Decimal(0);

      payments.forEach((payment:any) => {
        const amount = payment.amount || 0;
        totalRevenue = totalRevenue.plus(amount);
        platformFees = platformFees.plus(payment.platformFee || 0);
        mechanicEarnings = mechanicEarnings.plus(amount).minus(payment.platformFee || 0);
      });

      // Get refunds
      const refunds = await this.prisma.walletTransaction.findMany({
        where: {
          type: 'REFUND',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalRefunds = refunds.reduce(
        (sum:any, refund:any) => sum.plus(refund.amount || 0),
        new Decimal(0),
      );

      const netRevenue = totalRevenue.minus(totalRefunds);

      // Revenue by organization
      const revenueByOrganization = this.calculateRevenueByOrganization(payments);

      // Revenue by period
      const revenueByPeriod = this.calculateRevenueByPeriod(payments, filter.timeRange);

      return {
        totalRevenue: totalRevenue.toNumber(),
        platformFees: platformFees.toNumber(),
        mechanicEarnings: mechanicEarnings.toNumber(),
        refunds: totalRefunds.toNumber(),
        netRevenue: netRevenue.toNumber(),
        revenueByOrganization,
        revenueByPeriod,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get revenue report');
    }
  }

  /**
   * Get mechanic performance report
   */
  async getMechanicPerformance(
    mechanicId: string,
    filter: ReportFilterDto,
  ): Promise<MechanicPerformanceDto> {
    const operation = `Get mechanic performance for ${mechanicId}`;
    this.logger.log(`[${operation}]`);

    try {
      const { startDate, endDate } = this.getDateRange(filter);

     const mechanic = await this.prisma.user.findUnique({
      where: { id: mechanicId },
      include: {
        mechanicProfile: true,
      },
    });

      if (!mechanic || !mechanic.mechanicProfile) {
        throw new BadRequestException('Mechanic not found');
      }

      const segments = await this.prisma.bookingSegment.findMany({
        where: {
          mechanicId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          booking: { include: { dispatches: true } },
          payments: true,
        },
      });

      const completedSegments = segments.filter(
        (s) => s.status === SegmentStatus.COMPLETED,
      );
      const totalBookings = segments.length;
      const completionRate = 
        totalBookings > 0 ? (completedSegments.length / totalBookings) * 100 : 0;

      // Calculate earnings (segment has payments array)
      const totalEarnings = completedSegments.reduce(
        (sum:any, segment:any) => {
          const pay = segment.payments?.find((p) => p.status === PaymentStatus.SUCCESS);
          if (pay) {
            const amount = pay.amount || 0;
            return sum.plus(amount);
          }
          return sum;
        },
        new Decimal(0),
      );

      // Get ratings
      const ratings = await this.prisma.review.findMany({
        where: {
          mechanicId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
          : 0;

      // Calculate average response time (Invisible Foreman: booking has dispatches array)
      const acceptedDispatch = (s: typeof segments[0]) =>
        s.booking?.dispatches?.find((d) => d.status === 'ACCEPTED');
      const dispatchesWithResponse = segments.filter((s) => acceptedDispatch(s));
      const averageResponseTime =
        dispatchesWithResponse.length > 0
          ? dispatchesWithResponse.reduce((sum, s) => {
              const d = acceptedDispatch(s);
              if (d?.createdAt && d?.updatedAt) {
                const minutes = (d.updatedAt.getTime() - d.createdAt.getTime()) / (1000 * 60);
                return sum + minutes;
              }
              return sum;
            }, 0) / dispatchesWithResponse.length
          : 0;

      // Get disputes
      const disputes = await this.prisma.dispute.findMany({
        where: {
          booking: {
            segments: {
              some: {
                mechanicId,
              },
            },
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const resolvedDisputes = disputes.filter(
        (d) => d.status === 'RESOLVED',
      ).length;

      return {
        mechanicId,
        mechanicName: `${mechanic.firstName} ${mechanic.lastName}`,
        totalBookings,
        averageRating: Number(averageRating.toFixed(2)),
        totalEarnings: totalEarnings.toNumber(),
        completionRate: Number(completionRate.toFixed(2)),
        averageResponseTime: Number(averageResponseTime.toFixed(2)),
        onTimeCompletionRate: 0, // TODO: Calculate based on SLA
        disputesCount: disputes.length,
        resolvedDisputesCount: resolvedDisputes,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get mechanic performance');
    }
  }

  /**
   * Get organization report
   */
  async getOrganizationReport(
    organizationId: string,
    filter: ReportFilterDto,
  ): Promise<OrganizationReportDto> {
    const operation = `Get organization report for ${organizationId}`;
    this.logger.log(`[${operation}]`);

    try {
      const { startDate, endDate } = this.getDateRange(filter);

      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new BadRequestException('Organization not found');
      }

      const bookings = await this.prisma.booking.findMany({
        where: {
          orgId: organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          segments: {
            include: {
              payments: true,
            },
          },
        },
      });

      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          orgId: organizationId,
          status: VehicleStatus.ACTIVE,
        },
      });

      const mechanics = await this.prisma.user.findMany({
        where: {
          orgMemberships: {
            some: {
              orgId: organizationId,
            },
          },
        },
      });

      const totalSpending = bookings.reduce((sum, booking) => {
        return sum.plus(
          booking.segments.reduce((segSum, segment) => {
            const successPay = segment.payments?.find((p) => p.status === PaymentStatus.SUCCESS);
            if (successPay) {
              return segSum.plus(successPay.amount || 0);
            }
            return segSum;
          }, new Decimal(0)),
        );
      }, new Decimal(0));

      const averageBookingValue =
        bookings.length > 0 ? totalSpending.dividedBy(bookings.length).toNumber() : 0;

      const bookingsByStatus = bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const monthlySpending = this.groupSpendingByMonth(bookings, startDate, endDate);

      return {
        organizationId,
        organizationName: organization.name,
        totalBookings: bookings.length,
        activeVehicles: vehicles.length,
        assignedMechanics: mechanics.length,
        totalSpending: totalSpending.toNumber(),
        averageBookingValue: Number(averageBookingValue.toFixed(2)),
        bookingsByStatus,
        monthlySpending,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get organization report');
    }
  }

  // Helper methods

  private getDateRange(filter: ReportFilterDto): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date = new Date();

    if (filter.startDate && filter.endDate) {
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
    } else if (filter.timeRange) {
      const now = new Date();
      switch (filter.timeRange) {
        case TimeRange.DAILY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case TimeRange.WEEKLY:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case TimeRange.MONTHLY:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case TimeRange.YEARLY:
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
      }
    } else {
      // Default to last month
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  private groupByMonth(
    bookings: any[],
    startDate: Date,
    endDate: Date,
  ): Array<{ month: string; count: number; revenue: number }> {
    const monthMap = new Map<string, { count: number; revenue: number }>();

    bookings.forEach((booking) => {
      const month = booking.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthMap.get(month) || { count: 0, revenue: 0 };

      const revenue = booking.segments.reduce((sum: Decimal, segment: any) => {
        const successPay = segment.payments?.find((p: any) => p.status === PaymentStatus.SUCCESS);
        if (successPay) return sum.plus(successPay.amount || 0);
        return sum;
      }, new Decimal(0));

      monthMap.set(month, {
        count: current.count + 1,
        revenue: current.revenue + revenue.toNumber(),
      });
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  private calculateRevenueByOrganization(payments: any[]): Array<{
    organizationId: string;
    organizationName: string;
    revenue: number;
    bookingCount: number;
  }> {
    const orgMap = new Map<
      string,
      { name: string; revenue: Decimal; bookings: Set<string> }
    >();

    payments.forEach((payment) => {
      const orgId = payment.booking?.organizationId;
      if (!orgId) return;

      const orgName = payment.booking?.organization?.name || 'Unknown';
      const current = orgMap.get(orgId) || {
        name: orgName,
        revenue: new Decimal(0),
        bookings: new Set<string>(),
      };

      current.revenue = current.revenue.plus(payment.amount || 0);
      current.bookings.add(payment.bookingId);

      orgMap.set(orgId, current);
    });

    return Array.from(orgMap.entries()).map(([organizationId, data]) => ({
      organizationId,
      organizationName: data.name,
      revenue: data.revenue.toNumber(),
      bookingCount: data.bookings.size,
    }));
  }

  private calculateRevenueByPeriod(
    payments: any[],
    timeRange?: TimeRange,
  ): Array<{ period: string; revenue: number; bookings: number }> {
    const periodMap = new Map<string, { revenue: Decimal; bookings: Set<string> }>();

    payments.forEach((payment) => {
      let period: string;
      const date = payment.createdAt;

      if (timeRange === TimeRange.DAILY) {
        period = date.toISOString().substring(0, 10); // YYYY-MM-DD
      } else if (timeRange === TimeRange.WEEKLY) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().substring(0, 10);
      } else {
        period = date.toISOString().substring(0, 7); // YYYY-MM
      }

      const current = periodMap.get(period) || {
        revenue: new Decimal(0),
        bookings: new Set<string>(),
      };

      current.revenue = current.revenue.plus(payment.amount || 0);
      current.bookings.add(payment.bookingId);

      periodMap.set(period, current);
    });

    return Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue.toNumber(),
      bookings: data.bookings.size,
    }));
  }

  private groupSpendingByMonth(
    bookings: any[],
    startDate: Date,
    endDate: Date,
  ): Array<{ month: string; amount: number; bookings: number }> {
    const monthMap = new Map<string, { amount: Decimal; bookings: number }>();

    bookings.forEach((booking) => {
      const month = booking.createdAt.toISOString().substring(0, 7);
      const current = monthMap.get(month) || {
        amount: new Decimal(0),
        bookings: 0,
      };

      const spending = booking.segments.reduce((sum: Decimal, segment: any) => {
        const successPay = segment.payments?.find((p: any) => p.status === PaymentStatus.SUCCESS);
        if (successPay) return sum.plus(successPay.amount || 0);
        return sum;
      }, new Decimal(0));

      monthMap.set(month, {
        amount: current.amount.plus(spending),
        bookings: current.bookings + 1,
      });
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      amount: data.amount.toNumber(),
      bookings: data.bookings,
    }));
  }
}
