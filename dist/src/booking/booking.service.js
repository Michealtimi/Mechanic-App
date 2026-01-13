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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const payments_service_1 = require("../payments/payments.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const wallet_service_1 = require("../wallet/wallet.service");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
const chat_service_1 = require("../chat/chat.service");
let BookingService = BookingService_1 = class BookingService {
    prisma;
    paymentService;
    walletService;
    auditService;
    notificationGateway;
    usersService;
    chatService;
    logger = new new common_1.Logger(BookingService_1.name)();
    constructor(prisma, paymentService, walletService, auditService, notificationGateway, usersService, chatService) {
        this.prisma = prisma;
        this.paymentService = paymentService;
        this.walletService = walletService;
        this.auditService = auditService;
        this.notificationGateway = notificationGateway;
        this.usersService = usersService;
        this.chatService = chatService;
    }
    async createBooking(dto, customerId) {
        this.logger.log(`[createBooking] Starting creation for customer: ${customerId}`);
        try {
            const mechanic = await this.prisma.user.findUnique({
                where: { id: dto.mechanicId, role: client_1.Role.MECHANIC },
                select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, isAvailableForJobs: true, mechanicOnlineStatus: true, serviceRadiusKm: true, currentLat: true, currentLng: true },
            });
            if (!mechanic) {
                this.logger.warn(`[createBooking] Mechanic not found or not a mechanic role: ${dto.mechanicId}`);
                throw new common_1.NotFoundException('Mechanic not found or invalid role');
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
                    status: {
                        in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.IN_PROGRESS]
                    }
                },
            });
            if (existingBooking) {
                this.logger.warn(`[createBooking] Conflict: Time slot at ${dto.scheduledAt} already booked for mechanic ${dto.mechanicId}`);
                throw new common_1.ConflictException('Time slot already booked');
            }
            const customer = await this.prisma.user.findUnique({
                where: { id: customerId },
                select: { email: true, firstName: true, lastName: true, phoneNumber: true },
            });
            if (!customer) {
                this.logger.error(`[createBooking] Customer ${customerId} not found for booking.`);
                throw new common_1.InternalServerErrorException('Customer profile not found for payment processing.');
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const booking = await tx.booking.create({
                    data: {
                        customerId,
                        mechanicId: dto.mechanicId,
                        serviceId: dto.serviceId,
                        scheduledAt: new Date(dto.scheduledAt),
                        status: client_1.BookingStatus.PENDING,
                        price: service.price,
                    },
                    include: {
                        customer: true,
                        mechanic: true,
                        service: true,
                    },
                });
                this.logger.log(`[createBooking] Booking created successfully with ID: ${booking.id} in transaction.`);
                const chatRoom = await tx.chatRoom.create({
                    data: {
                        customerId: booking.customerId,
                        mechanicId: booking.mechanicId,
                        bookingId: booking.id,
                    },
                });
                await tx.booking.update({
                    where: { id: booking.id },
                    data: { chatRoomId: chatRoom.id },
                });
                this.logger.log(`[createBooking] ChatRoom created and linked to booking ${booking.id} with ID: ${chatRoom.id}`);
                const mechanicSub = await tx.subaccount.findFirst({
                    where: { mechanicId: mechanic.id },
                });
                const mechanicSubaccountIdentifier = mechanicSub?.subaccountCode || null;
                this.logger.debug(`[createBooking] Mechanic subaccount identifier for ${mechanic.id}: ${mechanicSubaccountIdentifier}`);
                const initPayment = await this.paymentService.initialize({
                    bookingId: booking.id,
                    amount: booking.price,
                    gateway: 'PAYSTACK',
                    metadata: {
                        customerEmail: customer.email,
                        customerName: `${customer.firstName} ${customer.lastName}`,
                        bookingId: booking.id,
                        mechanicId: mechanic.id,
                        serviceName: service.title,
                    },
                    mechanicSubaccount: mechanicSubaccountIdentifier,
                });
                this.logger.log(`[createBooking] Payment initialized for booking ${booking.id} with reference: ${initPayment.reference} in transaction.`);
                await tx.booking.update({
                    where: { id: booking.id },
                    data: {
                        payment: {
                            connect: { id: initPayment.id },
                        },
                    },
                });
                return { booking, payment: initPayment };
            });
            await this.auditService.log({
                actor: customerId,
                action: 'CREATE_BOOKING',
                entity: 'Booking',
                entityId: result.booking.id,
                after: {
                    mechanicId: result.booking.mechanicId,
                    serviceId: result.booking.serviceId,
                    scheduledAt: result.booking.scheduledAt,
                    price: result.booking.price.toString(),
                    status: result.booking.status,
                    paymentId: result.payment.id,
                    chatRoomId: result.booking.chatRoomId,
                },
            });
            this.logger.log(`[createBooking] Successfully created booking ID: ${result.booking.id}, linked chat, and initialized payment.`);
            return result;
        }
        catch (err) {
            this.logger.error(`Failed to create booking for customer ${customerId}: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.ConflictException ||
                err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to create booking or initialize payment');
        }
    }
    async getAllBookings(userId, filter) {
        this.logger.log(`[getAllBookings] Fetching bookings for user ID: ${userId}, Status: ${filter.status}, Skip: ${filter.skip}, Take: ${filter.take}`);
        try {
            const whereClause = {
                OR: [{ mechanicId: userId }, { customerId: userId }],
            };
            if (filter?.status) {
                whereClause.status = filter.status;
            }
            const [bookings, total] = await this.prisma.$transaction([
                this.prisma.booking.findMany({
                    where: whereClause,
                    orderBy: { scheduledAt: 'desc' },
                    skip: filter?.skip || 0,
                    take: filter?.take || 10,
                    include: {
                        customer: {
                            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
                        },
                        mechanic: {
                            select: { id: true, shopName: true, firstName: true, lastName: true, email: true, phoneNumber: true, averageRating: true, totalReviews: true, isEvSpecialist: true },
                        },
                        service: true,
                        chatRoom: {
                            select: { id: true },
                        },
                        payment: {
                            select: { id: true, status: true, amount: true, reference: true }
                        },
                    },
                }),
                this.prisma.booking.count({ where: whereClause }),
            ]);
            if (!bookings.length && (filter?.skip || 0) === 0) {
                this.logger.warn(`[getAllBookings] No bookings found for user ${userId} with current filters.`);
                return {
                    data: [],
                    meta: {
                        total: 0,
                        skip: filter?.skip || 0,
                        take: filter?.take || 10,
                        hasMore: false,
                    },
                };
            }
            this.logger.log(`[getAllBookings] Found ${bookings.length} bookings (Total: ${total}) for user ${userId}`);
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
            this.logger.error(`Failed to get all bookings for user ${userId}: ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException('Failed to retrieve bookings');
        }
    }
    async getBookingById(id, userId) {
        this.logger.log(`[getBookingById] Fetching booking with ID: ${id} for user ${userId}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id },
                include: {
                    customer: {
                        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
                    },
                    mechanic: {
                        select: { id: true, shopName: true, firstName: true, lastName: true, email: true, phoneNumber: true, averageRating: true, totalReviews: true, isEvSpecialist: true },
                    },
                    service: true,
                    chatRoom: {
                        select: { id: true },
                    },
                    payment: {
                        select: { id: true, status: true, amount: true, reference: true }
                    },
                    disputes: true,
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
            return booking;
        }
        catch (err) {
            this.logger.error(`Failed to get booking by ID ${id}: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve booking');
        }
    }
    async updateBookingStatus(id, dto, mechanicId) {
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
                    payment: { select: { id: true, reference: true, status: true } },
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
            if (booking.status === client_1.BookingStatus.CANCELLED || booking.status === client_1.BookingStatus.COMPLETED) {
                if (booking.status !== dto.status) {
                    this.logger.warn(`[updateBookingStatus] Cannot change status of a ${booking.status} booking ${id}.`);
                    throw new common_1.BadRequestException(`Cannot change status of a ${booking.status} booking.`);
                }
            }
            const updatedBooking = await this.prisma.$transaction(async (tx) => {
                const bookingUpdateData = {
                    status: dto.status,
                };
                if (dto.status === client_1.BookingStatus.COMPLETED) {
                    this.logger.log(`[updateBookingStatus] Booking ${id} completed. Initiating payment capture and mechanic credit.`);
                    if (!booking.payment || !booking.payment.reference) {
                        this.logger.error(`[updateBookingStatus] Booking ${id} completed but no payment record or reference found.`);
                        throw new common_1.InternalServerErrorException('Payment record or reference missing for completed booking.');
                    }
                    if (booking.payment.status !== client_1.PaymentStatus.AUTHORIZED) {
                        this.logger.error(`[updateBookingStatus] Booking ${id} payment is not authorized. Current status: ${booking.payment.status}.`);
                        throw new common_1.BadRequestException(`Payment for this booking is not authorized. Current status: ${booking.payment.status}.`);
                    }
                    await this.paymentService.capture(booking.payment.reference, tx);
                    this.logger.debug(`[updateBookingStatus] Payment captured for booking ${id}.`);
                    await this.walletService.creditMechanicWithTx(tx, booking.mechanicId, booking.price, booking.id);
                    this.logger.debug(`[updateBookingStatus] Mechanic ${booking.mechanicId} credited for booking ${id}.`);
                    await tx.user.update({
                        where: { id: booking.mechanicId },
                        data: { totalJobsCompleted: { increment: 1 } },
                    });
                    this.logger.debug(`[updateBookingStatus] Mechanic ${booking.mechanicId}'s totalJobsCompleted incremented.`);
                    this.logger.log(`[updateBookingStatus] Post-completion actions successful for booking ${id}.`);
                }
                const updated = await tx.booking.update({
                    where: { id },
                    data: bookingUpdateData,
                    include: { payment: true }
                });
                return updated;
            });
            if (dto.status === client_1.BookingStatus.COMPLETED) {
                await this.notificationGateway.emitBookingCompleted(booking.customerId, booking.id);
                this.logger.debug(`[updateBookingStatus] Customer ${booking.customerId} notified of booking ${id} completion.`);
            }
            else if (dto.status === client_1.BookingStatus.CONFIRMED) {
                await this.notificationGateway.emitBookingConfirmed(booking.customerId, booking.id);
                this.logger.debug(`[updateBookingStatus] Customer ${booking.customerId} notified of booking ${id} confirmation.`);
            }
            await this.auditService.log({
                actor: mechanicId,
                action: 'UPDATE_BOOKING_STATUS',
                entity: 'Booking',
                entityId: id,
                before: { status: booking.status, paymentStatus: booking.payment?.status },
                after: { status: dto.status, paymentStatus: updatedBooking.payment?.status },
            });
            this.logger.log(`[updateBookingStatus] Successfully updated booking ${id} to status ${updatedBooking.status}`);
            return updatedBooking;
        }
        catch (err) {
            this.logger.error(`Failed to update booking status for ID ${id}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.BadRequestException ||
                err instanceof common_1.ConflictException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to update booking status or complete post-update actions.');
        }
    }
    async cancelBooking(id, customerId) {
        this.logger.log(`[cancelBooking] Cancelling booking ${id} by customer ${customerId}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id },
                select: {
                    id: true,
                    customerId: true,
                    mechanicId: true,
                    price: true,
                    status: true,
                    payment: { select: { id: true, reference: true, status: true, refundedAmount: true, amount: true } },
                    scheduledAt: true,
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
            if (booking.status === client_1.BookingStatus.COMPLETED || booking.status === client_1.BookingStatus.CANCELLED) {
                this.logger.warn(`[cancelBooking] Booking ${id} cannot be cancelled as it is already ${booking.status}.`);
                throw new common_1.BadRequestException(`Booking cannot be cancelled as it is already ${booking.status}.`);
            }
            const CANCEL_FEE_PERCENTAGE = 0.1;
            const updatedBooking = await this.prisma.$transaction(async (tx) => {
                let refundAmount = new this.prisma.Decimal(0);
                let cancelFee = new this.prisma.Decimal(0);
                if (booking.payment && booking.payment.status === client_1.PaymentStatus.AUTHORIZED && booking.payment.reference) {
                    this.logger.log(`[cancelBooking] Payment ${booking.payment.reference} was AUTHORIZED. Calculating refund.`);
                    const bookingPriceDecimal = booking.price;
                    cancelFee = bookingPriceDecimal.times(new this.prisma.Decimal(CANCEL_FEE_PERCENTAGE));
                    refundAmount = bookingPriceDecimal.minus(cancelFee);
                    refundAmount = refundAmount.lessThan(0) ? new this.prisma.Decimal(0) : refundAmount;
                    this.logger.log(`[cancelBooking] Processing refund of ${refundAmount.toFixed(2)} (Fee: ${cancelFee.toFixed(2)}) for booking ${booking.id}.`);
                    await this.paymentService.refund(booking.payment.reference, refundAmount, tx);
                    this.logger.log(`[cancelBooking] Refund processed for booking ${booking.id}.`);
                }
                else {
                    this.logger.log(`[cancelBooking] No active AUTHORIZED payment to refund for booking ${booking.id}. Current payment status: ${booking.payment?.status || 'N/A'}`);
                }
                const updated = await tx.booking.update({
                    where: { id },
                    data: { status: client_1.BookingStatus.CANCELLED },
                    include: { payment: true }
                });
                return updated;
            });
            await this.notificationGateway.emitBookingCancelled(booking.mechanicId, booking.id);
            this.logger.log(`[cancelBooking] Mechanic ${booking.mechanicId} notified of cancellation.`);
            await this.auditService.log({
                actor: customerId,
                action: 'CANCEL_BOOKING',
                entity: 'Booking',
                entityId: id,
                before: { status: booking.status, paymentStatus: booking.payment?.status },
                after: { status: client_1.BookingStatus.CANCELLED, paymentStatus: updatedBooking.payment?.status || client_1.PaymentStatus.CANCELLED },
            });
            this.logger.log(`[cancelBooking] Successfully cancelled booking ${id}.`);
            return updatedBooking;
        }
        catch (err) {
            this.logger.error(`Failed to cancel booking ID ${id}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException ||
                err instanceof common_1.ForbiddenException ||
                err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to cancel booking or process refund.');
        }
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object, wallet_service_1.WalletService,
        audit_service_1.AuditService,
        notification_gateway_1.NotificationGateway,
        users_service_1.UsersService,
        chat_service_1.ChatService])
], BookingService);
//# sourceMappingURL=booking.service.js.map