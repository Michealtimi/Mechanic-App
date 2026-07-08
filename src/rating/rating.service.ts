/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { BookingStatus, Prisma, Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRating(dto: CreateRatingDto, customerId: string) {
    const op = `CreateRating for booking ${dto.bookingId}`;
    this.logger.log(`Starting ${op}`);

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        select: {
          id: true,
          customerId: true,
          mechanicId: true,
          status: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.customerId !== customerId) {
        throw new ForbiddenException('Only the booking customer can submit a rating.');
      }
      if (booking.status !== BookingStatus.COMPLETED) {
        throw new BadRequestException('Rating can only be submitted for a COMPLETED booking.');
      }
      if (booking.mechanicId !== dto.mechanicId) {
        throw new BadRequestException('Mechanic ID does not match the booking.');
      }

      const existing = await this.prisma.review.findFirst({
        where: { bookingId: dto.bookingId },
 select: { id: true },
      });
      if (existing) {
        throw new ConflictException('This booking has already been rated.');
      }

      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const review = await tx.review.create({
          data: {
            bookingId: dto.bookingId,
            mechanicId: dto.mechanicId,
            customerId,
            rating: dto.score,
            comment: dto.comment ?? null,
          },
        });

        const aggregationResult = await tx.review.aggregate({
          where: { mechanicId: dto.mechanicId },
          _avg: { rating: true },
          _count: true,
        });

        const newAverageScore = aggregationResult._avg.rating
          ? new Decimal(aggregationResult._avg.rating).toDecimalPlaces(2)
          : new Decimal(dto.score);
        const totalReviews = aggregationResult._count;

        await tx.user.update({
          where: { id: dto.mechanicId, role: Role.MECHANIC },
          data: {
            averageRating: newAverageScore.toNumber(),
            totalReviews,
          },
        });

        this.logger.debug(
          `[${op}] Mechanic ${dto.mechanicId} updated: Avg: ${newAverageScore}, Total: ${totalReviews}.`,
        );

        return review;
      });

      this.logger.log(`[${op}] Successfully created rating.`);
      return result;
    } catch (err: any) {
      this.logger.error(`[${op}] failed: ${err.message}`, err.stack);
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof BadRequestException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create rating.');
    }
  }

  async listMechanicRatings(mechanicId: string, page = 1, pageSize = 10) {
    const op = `ListMechanicRatings for ${mechanicId}`;
    this.logger.log(`Starting ${op}, Page: ${page}, Size: ${pageSize}`);

    try {
      const skip = (page - 1) * pageSize;

      const [reviews, total] = await this.prisma.$transaction([
        this.prisma.review.findMany({
          where: { mechanicId },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, firstName: true, lastName: true } },
            booking: { select: { id: true, scheduledAt: true } },
          },
        }),
        this.prisma.review.count({ where: { mechanicId } }),
      ]);

      return {
        data: reviews,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (err: any) {
      this.logger.error(`[${op}] failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to retrieve mechanic ratings.');
    }
  }
}
