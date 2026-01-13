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
var BookingCleanupService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const client_1 = require("@prisma/client");
const payments_service_1 = require("src/modules/payment/payments.service");
const config_1 = require("@nestjs/config");
let BookingCleanupService = BookingCleanupService_1 = class BookingCleanupService {
    prisma;
    notificationGateway;
    paymentsService;
    configService;
    logger = new common_1.Logger(BookingCleanupService_1.name);
    staleBookingCutoffMs;
    pendingPaymentCutoffMs;
    constructor(prisma, notificationGateway, paymentsService, configService) {
        this.prisma = prisma;
        this.notificationGateway = notificationGateway;
        this.paymentsService = paymentsService;
        this.configService = configService;
    }
    onModuleInit() {
        this.staleBookingCutoffMs = this.configService.get('BOOKING_STALE_CUTOFF_MINUTES', 15) * 60 * 1000;
        this.pendingPaymentCutoffMs = this.configService.get('PAYMENT_PENDING_CUTOFF_MINUTES', 30) * 60 * 1000;
        this.logger.log(`Stale booking cutoff: ${this.staleBookingCutoffMs / (1000 * 60)} minutes.`);
        this.logger.log(`Pending payment cutoff: ${this.pendingPaymentCutoffMs / (1000 * 60)} minutes.`);
    }
    async handleCron() {
        this.logger.log('Starting cron job: Booking and Payment Cleanup.');
        await this.cancelStaleBookings();
        await this.cancelStalePendingPayments();
        this.logger.log('Finished cron job: Booking and Payment Cleanup.');
    }
    async cancelStaleBookings() {
        this.logger.log('Running cancelStaleBookings task...');
        const cutoffDate = new Date(Date.now() - this.staleBookingCutoffMs);
        try {
            const staleBookings = await this.prisma.booking.findMany({
                where: {
                    status: client_1.BookingStatus.PENDING,
                    createdAt: { lt: cutoffDate },
                },
                include: {
                    customer: true,
                    mechanic: true,
                    payment: true,
                }
            });
            if (staleBookings.length === 0) {
                this.logger.log('No stale bookings found to cancel.');
                return;
            }
            this.logger.log(`Found ${staleBookings.length} stale bookings to cancel.`);
            for (const booking of staleBookings) {
                try {
                    await this.prisma.$transaction(async (tx) => {
                        const updatedBooking = await tx.booking.update({
                            where: { id: booking.id },
                            data: { status: client_1.BookingStatus.CANCELLED, updatedAt: new Date() },
                        });
                        this.logger.log(`Updated booking ${booking.id} to ${client_1.BookingStatus.CANCELLED}.`);
                        if (booking.payment && booking.payment.status === client_1.PaymentStatus.PENDING) {
                            await tx.payment.update({
                                where: { id: booking.payment.id },
                                data: { status: client_1.PaymentStatus.CANCELLED, updatedAt: new Date() },
                            });
                            this.logger.log(`Updated associated payment ${booking.payment.id} to ${client_1.PaymentStatus.CANCELLED}.`);
                        }
                        if (booking.mechanicId) {
                            await this.notificationGateway.emitBookingCancelled(booking.mechanicId, booking.id, 'Mechanic');
                        }
                        if (booking.customerId) {
                            await this.notificationGateway.emitBookingCancelled(booking.customerId, booking.id, 'Customer');
                        }
                        this.logger.log(`Notifications sent for cancelled booking ${booking.id}.`);
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to cancel booking ${booking.id}: ${error.message}`, error.stack);
                }
            }
            this.logger.log('Finished cancelStaleBookings task.');
        }
        catch (error) {
            this.logger.error(`Error during cancelStaleBookings cron job: ${error.message}`, error.stack);
        }
    }
    async cancelStalePendingPayments() {
        this.logger.log('Running cancelStalePendingPayments task...');
        const cutoffDate = new Date(Date.now() - this.pendingPaymentCutoffMs);
        try {
            const stalePayments = await this.prisma.payment.findMany({
                where: {
                    status: client_1.PaymentStatus.PENDING,
                    createdAt: { lt: cutoffDate },
                    OR: [
                        { booking: null },
                        { booking: { status: { not: client_1.BookingStatus.PENDING } } }
                    ]
                },
                include: {
                    booking: true
                }
            });
            if (stalePayments.length === 0) {
                this.logger.log('No stale pending payments found to cancel/refund.');
                return;
            }
            this.logger.log(`Found ${stalePayments.length} stale pending payments to cancel/refund.`);
            for (const payment of stalePayments) {
                try {
                    await this.prisma.$transaction(async (tx) => {
                        const verificationResult = await this.paymentsService.verifyPayment(payment.reference);
                        if (verificationResult.status === client_1.PaymentStatus.SUCCESS || verificationResult.status === client_1.PaymentStatus.CAPTURED) {
                            this.logger.log(`Payment ${payment.id} (${payment.reference}) was actually SUCCESSFUL upon verification. No cancellation needed.`);
                            return;
                        }
                        const updatedPayment = await tx.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: client_1.PaymentStatus.CANCELLED,
                                updatedAt: new Date(),
                                rawGatewayResponse: verificationResult.raw || payment.rawGatewayResponse,
                            },
                        });
                        this.logger.log(`Updated payment ${payment.id} (${payment.reference}) to ${client_1.PaymentStatus.CANCELLED}.`);
                        if (payment.userId) {
                            await this.notificationGateway.emitPaymentCancelled(payment.userId, payment.id);
                        }
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to cancel stale pending payment ${payment.id}: ${error.message}`, error.stack);
                }
            }
            this.logger.log('Finished cancelStalePendingPayments task.');
        }
        catch (error) {
            this.logger.error(`Error during cancelStalePendingPayments cron job: ${error.message}`, error.stack);
        }
    }
};
exports.BookingCleanupService = BookingCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingCleanupService.prototype, "handleCron", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingCleanupService.prototype, "cancelStalePendingPayments", null);
exports.BookingCleanupService = BookingCleanupService = BookingCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway, typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object, config_1.ConfigService])
], BookingCleanupService);
//# sourceMappingURL=booking-cleanup.service.js.map