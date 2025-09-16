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
let BookingService = BookingService_1 = class BookingService {
    prisma;
    logger = new common_1.Logger(BookingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBooking(dto, customerId) {
        this.logger.log(`[createBooking] received request for customer: ${customerId}`);
        console.log(`[createBooking] DTO: `, dto);
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
            },
            include: {
                customer: true,
                mechanic: true,
                service: true,
            },
        });
        this.logger.log(`[createBooking] Booking created successfully with ID: ${booking.id}`);
        console.log(`[createBooking] New booking data:`, booking);
        return booking;
    }
    async getAllBookings(userId) {
        this.logger.log(`[getAllBookings] Fetching all bookings for user ID: ${userId}`);
        const bookings = await this.prisma.booking.findMany({
            where: {
                OR: [{ mechanicId: userId }, { customerId: userId }],
            },
            include: {
                customer: {
                    select: { firstName: true, lastName: true },
                },
                mechanic: {
                    select: { shopName: true },
                },
                service: true,
            },
        });
        this.logger.log(`[getAllBookings] Found ${bookings.length} bookings for user ${userId}`);
        return bookings;
    }
    async getBookingById(id, userId) {
        this.logger.log(`[getBookingById] Fetching booking with ID: ${id} for user ${userId}`);
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
        return booking;
    }
    async updateBookingStatus(id, dto, mechanicId) {
        this.logger.log(`[updateBookingStatus] Updating booking ${id} to status ${dto.status} by mechanic ${mechanicId}`);
        const booking = await this.prisma.booking.findUnique({
            where: { id },
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
        this.logger.log(`[updateBookingStatus] Successfully updated booking ${id}`);
        return updatedBooking;
    }
    async cancelBooking(id, customerId) {
        this.logger.log(`[cancelBooking] Cancelling booking ${id} by customer ${customerId}`);
        const booking = await this.prisma.booking.findUnique({
            where: { id },
        });
        if (!booking) {
            this.logger.warn(`[cancelBooking] Booking with ID ${id} not found.`);
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.customerId !== customerId) {
            this.logger.error(`[cancelBooking] Forbidden: Customer ${customerId} cannot cancel booking ${id}`);
            throw new common_1.ForbiddenException('You cannot cancel this booking');
        }
        const updatedBooking = await this.prisma.booking.update({
            where: { id },
            data: { status: client_1.BookingStatus.CANCELLED },
        });
        this.logger.log(`[cancelBooking] Successfully cancelled booking ${id}`);
        return updatedBooking;
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map