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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const payment_services_1 = require("../paymnet/payment.services");
const audit_service_1 = require("../audit/audit.service");
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
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { disputes: true }
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.disputes.some(d => d.status === 'pending')) {
            throw new common_1.ForbiddenException('A pending dispute already exists for this booking.');
        }
        try {
            const dispute = await this.prisma.dispute.create({
                data: {
                    userId,
                    bookingId,
                    reason,
                    status: 'pending',
                },
            });
            await this.auditService.log(userId, 'RAISE_DISPUTE', 'DISPUTE', dispute.id);
            return dispute;
        }
        catch (error) {
            this.logger.error(`${operation} failed.`, error);
            throw new common_1.InternalServerErrorException('Failed to record dispute.');
        }
    }
    async resolveDispute(disputeId, resolution, refundAmount, isRefundToCustomer, isDebitMechanic) {
        const adminUserId = 'SYSTEM_ADMIN_ID';
        const operation = `Resolve dispute ${disputeId}`;
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                booking: {
                    select: { id: true, customerId: true, mechanicId: true, paymentId: true }
                }
            }
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        if (dispute.status !== 'pending')
            throw new common_1.ForbiddenException('Dispute already resolved.');
        if (!dispute.booking)
            throw new common_1.InternalServerErrorException('Dispute is not linked to a valid booking.');
        if (refundAmount < 0)
            throw new common_1.BadRequestException('Refund amount must be non-negative.');
        const { paymentId, mechanicId } = dispute.booking;
        try {
            const updatedDispute = await this.prisma.$transaction(async (tx) => {
                if (refundAmount > 0) {
                    if (isRefundToCustomer) {
                        if (!paymentId)
                            throw new common_1.InternalServerErrorException('Cannot refund: Payment reference missing.');
                        await this.paymentService.refundPayment(paymentId, refundAmount);
                        this.logger.log(`Customer refund initiated for ${refundAmount} via gateway.`);
                    }
                    if (isDebitMechanic) {
                        await this.walletService.debitWalletWithTx(tx, mechanicId, refundAmount, 'DISPUTE_DEBIT', dispute.bookingId);
                        this.logger.log(`Mechanic ${mechanicId} debited ${refundAmount} from wallet.`);
                    }
                }
                return tx.dispute.update({
                    where: { id: disputeId },
                    data: {
                        status: 'resolved',
                        resolution,
                        updatedAt: new Date(),
                        resolvedAmount: refundAmount,
                    },
                });
            });
            await this.auditService.log(adminUserId, 'RESOLVE_DISPUTE', 'DISPUTE', disputeId, { resolution, refundAmount });
            return updatedDispute;
        }
        catch (error) {
            this.logger.error(`${operation} failed during financial step.`, error);
            throw new common_1.InternalServerErrorException('Resolution failed: Financial transaction could not be completed.');
        }
    }
    async listAll() {
        return this.prisma.dispute.findMany({
            where: { status: 'pending' },
            include: { user: true, booking: true }
        });
    }
};
exports.DisputeService = DisputeService;
exports.DisputeService = DisputeService = DisputeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        payment_services_1.PaymentService,
        audit_service_1.AuditService])
], DisputeService);
//# sourceMappingURL=dispute.service.js.map