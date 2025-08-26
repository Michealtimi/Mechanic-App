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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const class_transformer_1 = require("class-transformer");
const bookingresponse_dto_1 = require("./dto/bookingresponse.dto");
let BookingService = class BookingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBooking(dto, customerId) {
        try {
            const mechanic = await this.prisma.user.findUnique({
                where: { id: dto.mechanicId },
            });
            if (!mechanic)
                throw new common_1.NotFoundException('Mechanic not found');
            const service = await this.prisma.mechanicService.findUnique({
                where: { id: dto.serviceId },
            });
            if (!service)
                throw new common_1.NotFoundException('Service not found');
            if (service.mechanicId !== dto.mechanicId) {
                throw new common_1.ForbiddenException('Service does not belong to this mechanic');
            }
            const existingBooking = await this.prisma.booking.findFirst({
                where: { scheduledAt: dto.scheduledAt, mechanicId: dto.mechanicId },
            });
            if (existingBooking) {
                throw new common_1.ConflictException('Time slot already booked');
            }
            const booking = await this.prisma.booking.create({
                data: {
                    customerId,
                    mechanicId: dto.mechanicId,
                    serviceId: dto.serviceId,
                    scheduledAt: new Date(dto.scheduledAt),
                    status: dto.status || 'PENDING',
                },
            });
            return {
                success: true,
                message: 'Booking created successfully',
                data: (0, class_transformer_1.plainToInstance)(bookingresponse_dto_1.BookingResponseDto, booking, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Booking creation failed');
        }
    }
    async getAllBookings(userId) {
        try {
            const bookings = await this.prisma.booking.findMany({
                where: { OR: [{ mechanicId: userId }, { customerId: userId }] },
            });
            return {
                success: true,
                message: 'Bookings retrieved successfully',
                data: (0, class_transformer_1.plainToInstance)(bookingresponse_dto_1.BookingResponseDto, bookings, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to retrieve bookings');
        }
    }
    async getBookingById(id, userId) {
        try {
            const booking = await this.prisma.booking.findUnique({ where: { id } });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.customerId !== userId && booking.mechanicId !== userId) {
                throw new common_1.ForbiddenException('You do not have access to this booking');
            }
            return {
                success: true,
                message: 'Booking retrieved successfully',
                data: (0, class_transformer_1.plainToInstance)(bookingresponse_dto_1.BookingResponseDto, booking, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to retrieve booking');
        }
    }
    async updateBookingStatus(id, dto, mechanicId) {
        try {
            const booking = await this.prisma.booking.findUnique({ where: { id } });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.mechanicId !== mechanicId) {
                throw new common_1.ForbiddenException('You cannot update this booking');
            }
            const updatedBooking = await this.prisma.booking.update({
                where: { id },
                data: { status: dto.status },
            });
            return {
                success: true,
                message: 'Booking status updated successfully',
                data: (0, class_transformer_1.plainToInstance)(bookingresponse_dto_1.BookingResponseDto, updatedBooking, {
                    excludeExtraneousValues: true,
                }),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to update booking status');
        }
    }
    async cancelBooking(id, customerId) {
        try {
            const booking = await this.prisma.booking.findUnique({ where: { id } });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.customerId !== customerId) {
                throw new common_1.ForbiddenException('You cannot cancel this booking');
            }
            await this.prisma.booking.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            return {
                success: true,
                message: 'Booking cancelled successfully',
                data: null,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message || 'Failed to cancel booking');
        }
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map