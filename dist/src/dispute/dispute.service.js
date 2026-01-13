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
var DisputeService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const payment_services_1 = require("../paymnet/payment.services");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let DisputeService = DisputeService_1 = class DisputeService {
    prisma;
    walletService;
    paymentService;
    auditService;
    logger = new common_1.Logger(DisputeService_1.name);
    constructor(prisma, walletService, paymentService, auditService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.paymentService = paymentService;
        this.auditService = auditService;
    }
    async raiseDispute(userId, bookingId, reason) {
        const operation = `Raise dispute for booking ${bookingId}`;
        this.logger.log(`[${operation}] Initiated by user ${userId}.`);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { disputes: true },
        });
        if (!booking) {
            this.logger.warn(`[${operation}] Booking ${bookingId} not found.`);
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.disputes.some(d => d.status === client_1.DisputeStatus.PENDING)) {
            this.logger.warn(`[${operation}] A pending dispute already exists for booking ${bookingId}.`);
            throw new common_1.ForbiddenException('A pending dispute already exists for this booking.');
        }
        try {
            const dispute = await this.prisma.dispute.create({
                data: {
                    userId,
                    bookingId,
                    reason,
                    status: client_1.DisputeStatus.PENDING,
                },
            });
            await this.auditService.log(userId, 'RAISE_DISPUTE', 'DISPUTE', dispute.id, { bookingId, reason, status: client_1.DisputeStatus.PENDING });
            this.logger.log(`[${operation}] Dispute ${dispute.id} created successfully.`);
            return dispute;
        }
        catch (error) {
            this.logger.error(`[${operation}] failed: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to record dispute.');
        }
    }
    async resolveDispute(disputeId, resolution, refundAmount, isRefundToCustomer, isDebitMechanic) {
        const adminUserId = 'SYSTEM_ADMIN_ID';
        const operation = `Resolve dispute ${disputeId}`;
        this.logger.log(`[${operation}] Initiated. Refund: ${refundAmount}, RefundToCustomer: ${isRefundToCustomer}, DebitMechanic: ${isDebitMechanic}`);
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                booking: {
                    select: { id: true, customerId: true, mechanicId: true, paymentId: true },
                },
            },
        });
        if (!dispute) {
            this.logger.warn(`[${operation}] Dispute ${disputeId} not found.`);
            throw new common_1.NotFoundException('Dispute not found');
        }
        if (dispute.status !== client_1.DisputeStatus.PENDING) {
            this.logger.warn(`[${operation}] Dispute ${disputeId} is not pending (current status: ${dispute.status}).`);
            throw new common_1.ForbiddenException('Dispute already resolved or cannot be resolved.');
        }
        if (!dispute.booking) {
            this.logger.error(`[${operation}] Dispute ${disputeId} is not linked to a valid booking.`);
            throw new common_1.InternalServerErrorException('Dispute is not linked to a valid booking.');
        }
        if (refundAmount < 0) {
            this.logger.warn(`[${operation}] Invalid refund amount: ${refundAmount}.`);
            throw new common_1.BadRequestException('Refund amount must be non-negative.');
        }
        const { paymentId, mechanicId } = dispute.booking;
        const decimalRefundAmount = new library_1.Decimal(refundAmount);
        try {
            const updatedDispute = await this.prisma.$transaction(async (tx) => {
                if (decimalRefundAmount.greaterThan(0)) {
                    if (isRefundToCustomer) {
                        if (!paymentId) {
                            this.logger.error(`[${operation}] Cannot refund: Payment reference missing for booking ${dispute.booking.id}.`);
                            throw new common_1.InternalServerErrorException('Cannot refund: Payment reference missing.');
                        }
                        await this.paymentService.refundPayment(paymentId, decimalRefundAmount.toNumber());
                        this.logger.log(`[${operation}] Customer refund initiated for ${decimalRefundAmount} via gateway.`);
                    }
                    if (isDebitMechanic) {
                        await this.walletService.debitWalletWithTx(tx, mechanicId, decimalRefundAmount, 'DISPUTE_DEBIT', dispute.bookingId);
                        this.logger.log(`[${operation}] Mechanic ${mechanicId} debited ${decimalRefundAmount} from wallet.`);
                    }
                }
                return tx.dispute.update({
                    where: { id: disputeId },
                    data: {
                        status: client_1.DisputeStatus.RESOLVED,
                        resolution,
                        updatedAt: new Date(),
                        resolvedAmount: decimalRefundAmount,
                    },
                });
            });
            await this.auditService.log(adminUserId, 'RESOLVE_DISPUTE', 'DISPUTE', disputeId, { resolution, refundAmount: decimalRefundAmount.toNumber(), isRefundToCustomer, isDebitMechanic, status: client_1.DisputeStatus.RESOLVED });
            this.logger.log(`[${operation}] Dispute ${disputeId} successfully resolved.`);
            return updatedDispute;
        }
        catch (error) {
            this.logger.error(`[${operation}] failed during financial step or transaction: ${error.message}`, error.stack);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Resolution failed: Financial transaction or database update could not be completed.');
        }
    }
    async listAll() {
        try {
            this.logger.log('Listing all pending disputes.');
            return this.prisma.dispute.findMany({
                where: { status: client_1.DisputeStatus.PENDING },
                include: { user: true, booking: true },
                orderBy: { createdAt: 'asc' },
            });
        }
        catch (error) {
            this.logger.error(`Failed to list disputes: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to retrieve disputes.');
        }
    }
    async getDisputeById(disputeId) {
        try {
            return this.prisma.dispute.findUnique({
                where: { id: disputeId },
                include: { user: true, booking: true },
            });
        }
        catch (error) {
            this.logger.error(`Failed to get dispute ${disputeId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to retrieve dispute details.');
        }
    }
};
exports.DisputeService = DisputeService;
exports.DisputeService = DisputeService = DisputeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService, typeof (_a = typeof payment_services_1.PaymentService !== "undefined" && payment_services_1.PaymentService) === "function" ? _a : Object, audit_service_1.AuditService])
], DisputeService);
//# sourceMappingURL=dispute.service.js.map