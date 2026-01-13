/* eslint-disable prettier/prettier */
import { Injectable, Logger, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { BookingStatus, Prisma, Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionClient } from 'prisma/prisma.service'; // Assuming this type is defined

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * =================================
   * 1. CREATE RATING
   * =================================
   * Creates a new rating and updates the mechanic's aggregated rating (average score and total reviews).
   * Ensures rating can only be submitted for completed jobs, once.
   */
  async createRating(dto: CreateRatingDto, customerId: string) {
    const op = `CreateRating for booking ${dto.bookingId}`;
    this.logger.log(`Starting ${op}`);

    try {
      // 1. Validate Booking and Business Rules
      const booking = await this.prisma.booking.findUnique({ 
        where: { id: dto.bookingId },
        select: { 
            id: true, 
            customerId: true, 
            mechanicId: true, 
            status: true,
            rating: { select: { id: true } } // Check if a rating already exists
        }
      });
      
      if (!booking) {
        this.logger.warn(`[${op}] Booking not found.`);
        throw new NotFoundException('Booking not found');
      }

      if (booking.customerId !== customerId) {
        this.logger.error(`[${op}] Forbidden: Customer ${customerId} does not own booking.`);
        throw new ForbiddenException('Only the booking customer can submit a rating.');
      }
      
      if (booking.status !== BookingStatus.COMPLETED) {
        this.logger.error(`[${op}] BadRequest: Booking status is ${booking.status}.`);
        throw new BadRequestException('Rating can only be submitted for a COMPLETED booking.');
      }

      // 2. Prevent duplicate rating
      if (booking.rating) {
        this.logger.warn(`[${op}] Conflict: Rating already exists for booking ${dto.bookingId}.`);
        throw new ConflictException('This booking has already been rated.');
      }

      // 3. Ensure mechanic matches
      if (booking.mechanicId !== dto.mechanicId) {
        this.logger.error(`[${op}] BadRequest: Mechanic ID mismatch. Booking mechanic: ${booking.mechanicId}.`);
        throw new BadRequestException('The mechanic ID provided does not match the mechanic assigned to this booking.');
      }

      // 4. Use Transaction for Atomic Creation and Aggregation Update
      const result = await this.prisma.$transaction(async (tx: TransactionClient) => {
        
        // 4.1 Create the Rating
        const rating = await tx.rating.create({
          data: {
            bookingId: dto.bookingId,
            mechanicId: dto.mechanicId,
            customerId,
            score: dto.score,
            comment: dto.comment,
          },
        });

        this.logger.debug(`[${op}] Rating ${rating.id} created.`);

        // 4.2 Recalculate Aggregated Rating (More Robust Approach)
        // We use the new rating's score + the existing total to derive the new average.
        // For simplicity and avoiding complex raw SQL, we use COUNT and AVG aggregation within the transaction.

        const aggregationResult = await tx.rating.aggregate({
            where: { mechanicId: dto.mechanicId },
            _avg: { score: true },
            _count: true,
        });

        const newAverageScore = aggregationResult._avg.score ? new Decimal(aggregationResult._avg.score).toDecimalPlaces(2) : new Decimal(dto.score);
        const totalReviews = aggregationResult._count;

        // 4.3 Update the Mechanic's User Record
        await tx.user.update({ 
            where: { id: dto.mechanicId, role: Role.MECHANIC }, 
            data: { 
                averageRating: newAverageScore, // Stored as Decimal or float
                totalReviews: totalReviews,
            }
        });

        this.logger.debug(`[${op}] Mechanic ${dto.mechanidId} updated: Avg: ${newAverageScore}, Total: ${totalReviews}.`);

        return rating;
      });

      this.logger.log(`[${op}] Successfully created rating and updated mechanic average.`);
      return result;

    } catch (err: any) {
      this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
      if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof ConflictException) throw err;
      throw new InternalServerErrorException('Failed to create rating or update mechanic profile.');
    }
  }

  /**
   * =================================
   * 2. LIST MECHANIC RATINGS
   * =================================
   * Retrieves a paginated list of reviews for a specific mechanic.
   */
  async listMechanicRatings(mechanicId: string, page = 1, pageSize = 10) {
    const op = `ListMechanicRatings for ${mechanicId}`;
    this.logger.log(`Starting ${op}, Page: ${page}, Size: ${pageSize}`);
    
    try {
        const skip = (page - 1) * pageSize;
        
        const [ratings, total] = await this.prisma.$transaction([
            this.prisma.rating.findMany({ 
                where: { mechanicId }, 
                skip,
                take: pageSize, 
                orderBy: { createdAt: 'desc' },
                include: { 
                    customer: { select: { id: true, firstName: true, lastName: true } }, 
                    booking: { select: { id: true, scheduledAt: true } }
                }
            }),
            this.prisma.rating.count({ where: { mechanicId }})
        ]);

        return {
            data: ratings,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            }
        };

    } catch (err: any) {
        this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
        throw new InternalServerErrorException('Failed to retrieve mechanic ratings.');
    }
  }
}