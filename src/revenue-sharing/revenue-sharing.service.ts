import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { RevenueShareDto, RevenueReportDto, RevenueFilterDto } from './dto/revenue-sharing.dto';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { PlatformConfigService } from 'src/config/platform-config.service';

@Injectable()
export class RevenueSharingService {
  private readonly logger = new Logger(RevenueSharingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  /**
   * Calculate revenue share for a booking
   */
  async calculateRevenueShare(bookingId: string): Promise<RevenueShareDto> {
    const operation = `Calculate revenue share for booking ${bookingId}`;
    this.logger.log(`[${operation}]`);

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          mechanic: true,
          segments: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        throw new NotFoundException('Booking is not completed');
      }

      // Calculate total amount from all segments (segment.payments is array)
      const totalAmount = booking.segments.reduce((sum, segment) => {
        const successPayment = segment.payments?.find((p) => p.status === PaymentStatus.SUCCESS);
        if (successPayment?.amount) return sum.plus(successPayment.amount);
        return sum;
      }, new Decimal(0));

      // Get mechanic commission rate
      const mechanic = booking.mechanic;
      const isExternal = mechanic?.isExternal || false;
      const commissionRate = mechanic?.commissionRate || (isExternal ? 15 : 0); // 15% default for external, 0% for internal

      // Use stored platform fee from booking; fallback to configurable commission % (Invisible Foreman: editable)
      const storedPlatformFee = booking.platformFee != null ? new Decimal(booking.platformFee.toString()) : null;
      const commissionPercent = await this.platformConfig.getPlatformCommissionPercent();
      const platformFee = storedPlatformFee ?? totalAmount.multipliedBy(commissionPercent).dividedBy(100);

      // Calculate mechanic commission
      const mechanicCommission = totalAmount.multipliedBy(commissionRate).dividedBy(100);

      return {
        bookingId,
        totalAmount: totalAmount.toNumber(),
        platformFee: platformFee.toNumber(),
        mechanicCommission: mechanicCommission.toNumber(),
        commissionRate,
        mechanicId: mechanic?.id || '',
        isExternal,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to calculate revenue share');
    }
  }

  /**
   * Record revenue share (called after booking completion). Persists to RevenueShare table.
   */
  async recordRevenueShare(bookingId: string): Promise<void> {
    const operation = `Record revenue share for booking ${bookingId}`;
    this.logger.log(`[${operation}]`);

    try {
      const revenueShare = await this.calculateRevenueShare(bookingId);

      await this.prisma.revenueShare.upsert({
        where: { bookingId },
        create: {
          bookingId: revenueShare.bookingId,
          totalAmount: revenueShare.totalAmount,
          platformFee: revenueShare.platformFee,
          mechanicCommission: revenueShare.mechanicCommission,
          commissionRate: revenueShare.commissionRate,
          mechanicId: revenueShare.mechanicId || null,
          isExternal: revenueShare.isExternal,
        },
        update: {
          totalAmount: revenueShare.totalAmount,
          platformFee: revenueShare.platformFee,
          mechanicCommission: revenueShare.mechanicCommission,
          commissionRate: revenueShare.commissionRate,
          mechanicId: revenueShare.mechanicId || null,
          isExternal: revenueShare.isExternal,
        },
      });

      this.logger.log(`[${operation}] Revenue share persisted.`);
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to record revenue share');
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(filters: RevenueFilterDto): Promise<RevenueReportDto> {
    const operation = 'Get revenue report';
    this.logger.log(`[${operation}]`);

    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
      const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

      // Build where clause
      const where: any = {
        status: BookingStatus.COMPLETED,
        segments: {
          some: {
            payments: {
              some: { status: PaymentStatus.SUCCESS },
            },
          },
        },
      };

      if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) where.completedAt.gte = startDate;
        if (endDate) where.completedAt.lte = endDate;
      }

      if (filters.mechanicId) {
        where.mechanicId = filters.mechanicId;
      }

      if (filters.externalOnly) {
        where.mechanic = {
          isExternal: true,
        };
      }

      // Get all completed bookings
      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          mechanic: true,
          segments: {
            include: {
              payments: true,
            },
          },
        },
      });

      // Calculate totals
      let totalRevenue = new Decimal(0);
      let totalPlatformFees = new Decimal(0);
      let totalCommissions = new Decimal(0);
      const revenueByMechanic: Record<string, {
        mechanicId: string;
        mechanicName: string;
        totalRevenue: number;
        commission: number;
        bookingCount: number;
      }> = {};

      for (const booking of bookings) {
        const bookingTotal = booking.segments.reduce((sum, segment) => {
          const successPayment = segment.payments?.find((p) => p.status === PaymentStatus.SUCCESS);
          if (successPayment?.amount) return sum.plus(successPayment.amount);
          return sum;
        }, new Decimal(0));

        totalRevenue = totalRevenue.plus(bookingTotal);

        const storedFee = booking.platformFee != null ? new Decimal(booking.platformFee.toString()) : null;
        const platformFee = storedFee ?? bookingTotal.multipliedBy(this.DEFAULT_PLATFORM_FEE_PERCENT).dividedBy(100);
        totalPlatformFees = totalPlatformFees.plus(platformFee);

        if (booking.mechanic) {
          const isExternal = booking.mechanic.isExternal || false;
          const commissionRate = booking.mechanic.commissionRate || (isExternal ? 15 : 0);
          const commission = bookingTotal.multipliedBy(commissionRate).dividedBy(100);
          totalCommissions = totalCommissions.plus(commission);

          // Aggregate by mechanic
          const mechanicId = booking.mechanic.id;
          if (!revenueByMechanic[mechanicId]) {
            revenueByMechanic[mechanicId] = {
              mechanicId,
              mechanicName: `${booking.mechanic.firstName || ''} ${booking.mechanic.lastName || ''}`.trim(),
              totalRevenue: 0,
              commission: 0,
              bookingCount: 0,
            };
          }

          revenueByMechanic[mechanicId].totalRevenue += bookingTotal.toNumber();
          revenueByMechanic[mechanicId].commission += commission.toNumber();
          revenueByMechanic[mechanicId].bookingCount += 1;
        }
      }

      const externalMechanicsCount = Object.keys(revenueByMechanic).filter(
        (id) => bookings.find((b) => b.mechanicId === id)?.mechanic?.isExternal,
      ).length;

      const averageCommissionRate = bookings.length > 0
        ? bookings.reduce((sum, b) => {
            const isExternal = b.mechanic?.isExternal || false;
            return sum + (b.mechanic?.commissionRate || (isExternal ? 15 : 0));
          }, 0) / bookings.length
        : 0;

      return {
        totalRevenue: totalRevenue.toNumber(),
        totalPlatformFees: totalPlatformFees.toNumber(),
        totalCommissions: totalCommissions.toNumber(),
        bookingCount: bookings.length,
        averageCommissionRate,
        externalMechanicsCount,
        revenueByMechanic,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get revenue report');
    }
  }

  /**
   * Get revenue share for a specific mechanic
   */
  async getMechanicRevenue(mechanicId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalCommission: number;
    bookingCount: number;
    averageCommissionRate: number;
  }> {
    const operation = `Get revenue for mechanic ${mechanicId}`;
    this.logger.log(`[${operation}]`);

    try {
      const where: any = {
        mechanicId,
        status: BookingStatus.COMPLETED,
        segments: {
          some: {
            payment: {
              status: PaymentStatus.SUCCESS,
            },
          },
        },
      };

      if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) where.completedAt.gte = startDate;
        if (endDate) where.completedAt.lte = endDate;
      }

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          mechanic: true,
          segments: {
            include: {
              payments: true,
            },
          },
        },
      });

      let totalRevenue = new Decimal(0);
      let totalCommission = new Decimal(0);

      for (const booking of bookings) {
        const bookingTotal = booking.segments.reduce((sum, segment) => {
          const successPayment = segment.payments?.find((p) => p.status === PaymentStatus.SUCCESS);
          if (successPayment?.amount) return sum.plus(successPayment.amount);
          return sum;
        }, new Decimal(0));

        totalRevenue = totalRevenue.plus(bookingTotal);

        const isExternal = booking.mechanic?.isExternal || false;
        const commissionRate = booking.mechanic?.commissionRate || (isExternal ? 15 : 0);
        const commission = bookingTotal.multipliedBy(commissionRate).dividedBy(100);
        totalCommission = totalCommission.plus(commission);
      }

      const averageCommissionRate = bookings.length > 0 && bookings[0].mechanic
        ? (bookings[0].mechanic.commissionRate || (bookings[0].mechanic.isExternal ? 15 : 0))
        : 0;

      return {
        totalRevenue: totalRevenue.toNumber(),
        totalCommission: totalCommission.toNumber(),
        bookingCount: bookings.length,
        averageCommissionRate,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get mechanic revenue');
    }
  }
}
