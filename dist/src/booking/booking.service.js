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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const payment_services_1 = require("../paymnet/payment.services");
const notification_gateway_1 = require("../notification/notification.gateway");
const wallet_service_1 = require("../wallet/wallet.service");
let BookingService = BookingService_1 = class BookingService {
    prisma;
    paymentService;
    walletService;
    notificationGateway;
    logger = new common_1.Logger(BookingService_1.name);
    constructor(prisma, paymentService, walletService, notificationGateway) {
        this.prisma = prisma;
        this.paymentService = paymentService;
        this.walletService = walletService;
        this.notificationGateway = notificationGateway;
    }
    async createBooking(dto, customerId) {
        console.log(`[createBooking] Starting creation for customer: ${customerId}`);
        this.logger.log(`[createBooking] received request for customer: ${customerId}`);
        try {
            const mechanic = await this.prisma.user.findUnique({
                where: { id: dto.mechanicId },
            });
            if (!mechanic) {
                this.logger.warn(`[createBooking] Mechanic not found: ${dto.mechanicId}`);
                throw new common_1.NotFoundException('Mechanic not found');
            }
            const service = await this.prisma.mechanicService.findUnique({
                where: { id: dto.serviceId },
            });
            if (!service) {
                this.logger.warn(`[createBooking] Service not found: ${dto.serviceId}`);
                throw new common_1.NotFoundException('Service not found');
            }
            if (service.mechanicId !== dto.mechanicId) {
                this.logger.error(`[createBooking] Forbidden: Service ${dto.serviceId} does not belong to mechanic ${dto.mechanicId}`);
                throw new common_1.ForbiddenException('Service does not belong to this mechanic');
            }
            const existingBooking = await this.prisma.booking.findFirst({
                where: {
                    scheduledAt: dto.scheduledAt,
                    mechanicId: dto.mechanicId,
                },
            });
            if (existingBooking) {
                this.logger.warn(`[createBooking] Conflict: Time slot at ${dto.scheduledAt} already booked for mechanic ${dto.mechanicId}`);
                throw new common_1.ConflictException('Time slot already booked');
            }
            const booking = await this.prisma.booking.create({
                data: {
                    customerId,
                    mechanicId: dto.mechanicId,
                    serviceId: dto.serviceId,
                    scheduledAt: new Date(dto.scheduledAt),
                    status: dto.status || client_1.BookingStatus.PENDING,
                    price: service.price,
                },
                include: {
                    customer: true,
                    mechanic: true,
                    service: true,
                },
            });
            this.logger.log(`[createBooking] Booking created successfully with ID: ${booking.id}`);
            console.log(`[createBooking] Successfully created booking ID: ${booking.id}`);
            return booking;
        }
        catch (err) {
            this.logger.error(`Failed to create booking for customer ${customerId}`, err.stack);
            if (err instanceof common_1.NotFoundException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.ConflictException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to create booking');
        }
    }
    async getAllBookings(userId, filter) {
        console.log(`[getAllBookings] Fetching bookings for user ID: ${userId} with filters:`, filter);
        this.logger.log(`[getAllBookings] Fetching bookings for user ID: ${userId}, Status: ${filter.status}, Skip: ${filter.skip}, Take: ${filter.take}`);
        try {
            const bookings = await this.prisma.booking.findMany({
                where: {
                    OR: [{ mechanicId: userId }, { customerId: userId }],
                    status: filter?.status,
                },
                orderBy: { scheduledAt: 'desc' },
                skip: filter?.skip || 0,
                take: filter?.take || 10,
                include: {
                    customer: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    mechanic: {
                        select: { id: true, shopName: true },
                    },
                    service: true,
                },
            });
            const total = await this.prisma.booking.count({
                where: {
                    OR: [{ mechanicId: userId }, { customerId: userId }],
                    status: filter?.status,
                },
            });
            this.logger.log(`[getAllBookings] Found ${bookings.length} bookings (Total: ${total}) for user ${userId}`);
            console.log(`[getAllBookings] Returning ${bookings.length} bookings out of ${total} total.`);
            return {
                data: bookings,
                meta: {
                    total,
                    skip: filter?.skip || 0,
                    take: filter?.take || 10,
                    hasMore: (filter?.skip || 0) + (filter?.take || 10) < total,
                },
            };
        }
        catch (err) {
            this.logger.error(`Failed to get all bookings for user ${userId}`, err.stack);
            throw new common_1.InternalServerErrorException('Failed to retrieve bookings');
        }
    }
    async getBookingById(id, userId) {
        console.log(`[getBookingById] Checking access for booking ID: ${id} by user ${userId}`);
        this.logger.log(`[getBookingById] Fetching booking with ID: ${id} for user ${userId}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id },
                include: {
                    customer: true,
                    mechanic: true,
                    service: true,
                },
            });
            if (!booking) {
                this.logger.warn(`[getBookingById] Booking with ID ${id} not found.`);
                throw new common_1.NotFoundException('Booking not found');
            }
            if (booking.customerId !== userId && booking.mechanicId !== userId) {
                this.logger.error(`[getBookingById] Forbidden: User ${userId} does not have access to booking ${id}`);
                throw new common_1.ForbiddenException('You do not have access to this booking');
            }
            this.logger.log(`[getBookingById] Successfully retrieved booking ${id}`);
            console.log(`[getBookingById] Booking ${id} retrieved.`);
            return booking;
        }
        catch (err) {
            this.logger.error(`Failed to get booking by ID ${id}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve booking');
        }
    }
    async updateBookingStatus(id, dto, mechanicId) {
        console.log(`[updateBookingStatus] Attempting to update booking ${id} status to ${dto.status}`);
        this.logger.log(`[updateBookingStatus] Updating booking ${id} to status ${dto.status} by mechanic ${mechanicId}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id },
                select: {
                    id: true,
                    mechanicId: true,
                    customerId: true,
                    price: true,
                    status: true,
                },
            });
            if (!booking) {
                this.logger.warn(`[updateBookingStatus] Booking with ID ${id} not found.`);
                throw new common_1.NotFoundException('Booking not found');
            }
            if (booking.mechanicId !== mechanicId) {
                this.logger.error(`[updateBookingStatus] Forbidden: Mechanic ${mechanicId} cannot update booking ${id}`);
                throw new common_1.ForbiddenException('You cannot update this booking');
            }
            const updatedBooking = await this.prisma.booking.update({
                where: { id },
                data: { status: dto.status },
            });
            if (dto.status === client_1.BookingStatus.COMPLETED) {
                this.logger.log(`[updateBookingStatus] Booking ${id} completed. Initiating payment and notification.`);
                await this.paymentService.capturePayment(booking.id);
                await this.walletService.creditMechanic(booking.mechanicId, booking.price, booking.id);
                await this.notificationGateway.emitBookingCompleted(booking.customerId, booking.id);
                this.logger.log(`[updateBookingStatus] Post-completion actions successful for booking ${id}.`);
            }
            this.logger.log(`[updateBookingStatus] Successfully updated booking ${id}`);
            console.log(`[updateBookingStatus] Booking ${id} updated to ${updatedBooking.status}`);
            return updatedBooking;
        }
        catch (err) {
            this.logger.error(`Failed to update booking status for ID ${id}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to update booking status or complete post-update actions.');
        }
    }
    async cancelBooking(id, customerId) {
        console.log(`[cancelBooking] Attempting to cancel booking ${id} by customer ${customerId}`);
        this.logger.log(`[cancelBooking] Cancelling booking ${id} by customer ${customerId}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id },
                select: {
                    id: true,
                    customerId: true,
                    mechanicId: true,
                    price: true,
                    paymentStatus: true,
                },
            });
            if (!booking) {
                this.logger.warn(`[cancelBooking] Booking with ID ${id} not found.`);
                throw new common_1.NotFoundException('Booking not found');
            }
            if (booking.customerId !== customerId) {
                this.logger.error(`[cancelBooking] Forbidden: Customer ${customerId} cannot cancel booking ${id}`);
                throw new common_1.ForbiddenException('You cannot cancel this booking');
            }
            const CANCEL_FEE_PERCENTAGE = 0.1;
            if (booking.paymentStatus === 'AUTHORIZED') {
                const cancelFeeAmount = booking.price * CANCEL_FEE_PERCENTAGE;
                const refundAmount = booking.price - cancelFeeAmount;
                this.logger.log(`[cancelBooking] Processing partial refund of ${refundAmount} (Fee: ${cancelFeeAmount}) for booking ${booking.id}.`);
                await this.paymentService.partialRefund(booking.id, refundAmount);
            }
            const updatedBooking = await this.prisma.booking.update({
                where: { id },
                data: { status: client_1.BookingStatus.CANCELLED },
            });
            await this.notificationGateway.emitBookingCancelled(booking.mechanicId, booking.id);
            this.logger.log(`[cancelBooking] Mechanic ${booking.mechanicId} notified of cancellation.`);
            this.logger.log(`[cancelBooking] Successfully cancelled booking ${id}`);
            console.log(`[cancelBooking] Booking ${id} successfully CANCELLED.`);
            return updatedBooking;
        }
        catch (err) {
            this.logger.error(`Failed to cancel booking ID ${id}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to cancel booking or process refund.');
        }
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payment_services_1.PaymentService,
        wallet_service_1.WalletService,
        notification_gateway_1.NotificationGateway])
], BookingService);
//# sourceMappingURL=booking.service.js.map