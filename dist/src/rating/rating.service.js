"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RatingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let RatingService = RatingService_1 = class RatingService {
    prisma;
    logger = new common_1.Logger(RatingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRating(dto, customerId) {
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
                    rating: { select: { id: true } }
                }
            });
            if (!booking) {
                this.logger.warn(`[${op}] Booking not found.`);
                throw new common_1.NotFoundException('Booking not found');
            }
            if (booking.customerId !== customerId) {
                this.logger.error(`[${op}] Forbidden: Customer ${customerId} does not own booking.`);
                throw new common_1.ForbiddenException('Only the booking customer can submit a rating.');
            }
            if (booking.status !== client_1.BookingStatus.COMPLETED) {
                this.logger.error(`[${op}] BadRequest: Booking status is ${booking.status}.`);
                throw new common_1.BadRequestException('Rating can only be submitted for a COMPLETED booking.');
            }
            if (booking.rating) {
                this.logger.warn(`[${op}] Conflict: Rating already exists for booking ${dto.bookingId}.`);
                throw new common_1.ConflictException('This booking has already been rated.');
            }
            if (booking.mechanicId !== dto.mechanicId) {
                this.logger.error(`[${op}] BadRequest: Mechanic ID mismatch. Booking mechanic: ${booking.mechanicId}.`);
                throw new common_1.BadRequestException('The mechanic ID provided does not match the mechanic assigned to this booking.');
            }
            const result = await this.prisma.$transaction(async (tx) => {
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
                const aggregationResult = await tx.rating.aggregate({
                    where: { mechanicId: dto.mechanicId },
                    _avg: { score: true },
                    _count: true,
                });
                const newAverageScore = aggregationResult._avg.score ? new library_1.Decimal(aggregationResult._avg.score).toDecimalPlaces(2) : new library_1.Decimal(dto.score);
                const totalReviews = aggregationResult._count;
                await tx.user.update({
                    where: { id: dto.mechanicId, role: client_1.Role.MECHANIC },
                    data: {
                        averageRating: newAverageScore,
                        totalReviews: totalReviews,
                    }
                });
                this.logger.debug(`[${op}] Mechanic ${dto.mechanidId} updated: Avg: ${newAverageScore}, Total: ${totalReviews}.`);
                return rating;
            });
            this.logger.log(`[${op}] Successfully created rating and updated mechanic average.`);
            return result;
        }
        catch (err) {
            this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException || err instanceof common_1.ConflictException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to create rating or update mechanic profile.');
        }
    }
    async listMechanicRatings(mechanicId, page = 1, pageSize = 10) {
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
                this.prisma.rating.count({ where: { mechanicId } })
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
        }
        catch (err) {
            this.logger.error(`❌ ${op} failed: ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException('Failed to retrieve mechanic ratings.');
        }
    }
};
exports.RatingService = RatingService;
exports.RatingService = RatingService = RatingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RatingService);
//# sourceMappingURL=rating.service.js.map