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
var DispatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notification_gateway_1 = require("../notification/notification.gateway");
let DispatchService = DispatchService_1 = class DispatchService {
    prisma;
    notificationGateway;
    logger = new common_1.Logger(DispatchService_1.name);
    constructor(prisma, notificationGateway) {
        this.prisma = prisma;
        this.notificationGateway = notificationGateway;
    }
    async createDispatch(dto, createdBy) {
        const operation = `CreateDispatch for booking ${dto.bookingId}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: dto.bookingId },
                select: {
                    id: true,
                    status: true,
                    mechanicId: true,
                    pickupLatitude: true,
                    pickupLongitude: true,
                }
            });
            if (!booking) {
                this.logger.warn(`[${operation}] Booking not found.`);
                throw new common_1.NotFoundException('Booking not found');
            }
            if (booking.status !== client_1.BookingStatus.PENDING && booking.status !== client_1.BookingStatus.CONFIRMED) {
                this.logger.warn(`[${operation}] Booking status ${booking.status} is invalid for dispatch.`);
                throw new common_1.BadRequestException(`Booking cannot be dispatched in current status (${booking.status}).`);
            }
            let mechanicId = dto.mechanicId;
            if (mechanicId) {
                const m = await this.prisma.user.findUnique({ where: { id: mechanicId, role: client_1.Role.MECHANIC } });
                if (!m) {
                    throw new common_1.NotFoundException('Mechanic not found or invalid role');
                }
                this.logger.log(`[${operation}] Manual assignment to mechanic ${mechanicId}.`);
            }
            else {
                if (!booking.pickupLatitude || !booking.pickupLongitude) {
                    this.logger.error(`[${operation}] Auto-dispatch failed: Missing location data for booking ${dto.bookingId}.`);
                    throw new common_1.BadRequestException('Booking location data is required for auto-dispatch.');
                }
                const availableMechanic = await this.prisma.user.findFirst({
                    where: {
                        role: client_1.Role.MECHANIC,
                        isAvailableForJobs: true,
                        mechanicOnlineStatus: 'ONLINE',
                    },
                    orderBy: { currentLat: 'asc' },
                });
                if (!availableMechanic) {
                    this.logger.warn(`[${operation}] Auto-dispatch failed: No available mechanics found.`);
                    throw new common_1.NotFoundException('No available mechanics found for assignment.');
                }
                mechanicId = availableMechanic.id;
                this.logger.log(`[${operation}] Placeholder auto-assigned mechanic ${mechanicId}.`);
            }
            const dispatch = await this.prisma.dispatch.create({
                data: {
                    bookingId: dto.bookingId,
                    mechanicId,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                    status: 'ASSIGNED',
                },
            });
            await this.notificationGateway.emitDispatchAssigned(mechanicId, {
                bookingId: dto.bookingId,
                dispatchId: dispatch.id,
            });
            this.logger.log(`Dispatch ${dispatch.id} created for booking ${dto.bookingId} -> mechanic ${mechanicId}`);
            return dispatch;
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.ForbiddenException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to create dispatch');
        }
    }
    async acceptDispatch(dispatchId, mechanicId) {
        const operation = `AcceptDispatch ${dispatchId} by ${mechanicId}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const dispatch = await this.prisma.dispatch.findUnique({ where: { id: dispatchId } });
            if (!dispatch)
                throw new common_1.NotFoundException('Dispatch not found');
            if (dispatch.mechanicId !== mechanicId)
                throw new common_1.ForbiddenException('Not your dispatch');
            if (dispatch.expiresAt && dispatch.expiresAt < new Date()) {
                throw new common_1.BadRequestException('This dispatch assignment has expired.');
            }
            if (dispatch.status !== 'ASSIGNED' && dispatch.status !== 'PENDING') {
                throw new common_1.BadRequestException('Dispatch cannot be accepted as it is already in progress or completed/rejected.');
            }
            const [updatedDispatch, updatedBooking] = await this.prisma.$transaction(async (tx) => {
                const updatedD = await tx.dispatch.update({
                    where: { id: dispatchId },
                    data: { status: 'ACCEPTED', acceptedAt: new Date() },
                });
                const updatedB = await tx.booking.update({
                    where: { id: dispatch.bookingId },
                    data: {
                        status: client_1.BookingStatus.CONFIRMED,
                        mechanicId: mechanicId,
                    },
                    select: { customerId: true }
                });
                return [updatedD, updatedB];
            });
            await this.notificationGateway.emitDispatchAccepted(dispatch.bookingId, mechanicId, updatedBooking.customerId);
            this.logger.log(`Dispatch ${dispatchId} accepted. Booking ${dispatch.bookingId} CONFIRMED.`);
            return updatedDispatch;
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to accept dispatch');
        }
    }
    async rejectDispatch(dispatchId, mechanicId, reason) {
        const operation = `RejectDispatch ${dispatchId} by ${mechanicId}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const dispatch = await this.prisma.dispatch.findUnique({ where: { id: dispatchId } });
            if (!dispatch)
                throw new common_1.NotFoundException('Dispatch not found');
            if (dispatch.mechanicId !== mechanicId)
                throw new common_1.ForbiddenException('Not your dispatch');
            if (dispatch.status !== 'ASSIGNED' && dispatch.status !== 'PENDING') {
                throw new common_1.BadRequestException(`Dispatch is already in final state: ${dispatch.status}`);
            }
            const updated = await this.prisma.dispatch.update({
                where: { id: dispatchId },
                data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason },
            });
            await this.notificationGateway.emitDispatchRejected(dispatch.bookingId, mechanicId, reason);
            this.logger.log(`Dispatch ${dispatchId} rejected by ${mechanicId}. System notified for next step.`);
            return updated;
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to reject dispatch');
        }
    }
};
exports.DispatchService = DispatchService;
exports.DispatchService = DispatchService = DispatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway])
], DispatchService);
//# sourceMappingURL=dispatch.service.js.map