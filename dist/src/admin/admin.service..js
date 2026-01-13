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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dispute_service_1 = require("../dispute/dispute.service");
const wallet_service_1 = require("../wallet/wallet.service");
const client_1 = require("@prisma/client");
const decimal_js_1 = require("decimal.js");
const payments_services_1 = require("../paymnet/payments.services");
let AdminService = AdminService_1 = class AdminService {
    prisma;
    disputeService;
    paymentsService;
    walletService;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(prisma, disputeService, paymentsService, walletService) {
        this.prisma = prisma;
        this.disputeService = disputeService;
        this.paymentsService = paymentsService;
        this.walletService = walletService;
    }
    async resolveDispute(disputeId, dto) {
        const operation = `Resolving dispute ID: ${disputeId}`;
        this.logger.log(`Starting: ${operation} with data: ${JSON.stringify(dto)}`);
        return this.prisma.$transaction(async (tx) => {
            const dispute = await tx.dispute.findUnique({
                where: { id: disputeId },
                include: { booking: { include: { payment: true } } },
            });
            if (!dispute) {
                throw new common_1.NotFoundException('Dispute not found.');
            }
            if (dispute.status !== client_1.DisputeStatus.PENDING) {
                throw new common_1.BadRequestException(`Dispute is already ${dispute.status}. Cannot resolve a non-pending dispute.`);
            }
            if ((dto.refundToCustomer || dto.debitMechanic) && dto.refundAmount <= 0) {
                throw new common_1.BadRequestException('Refund/debit amount must be greater than zero if requested.');
            }
            const amountDecimal = new decimal_js_1.Decimal(dto.refundAmount);
            try {
                if (dto.refundToCustomer && dispute.booking?.payment?.reference) {
                    await this.paymentsService.refundPayment(tx, dispute.booking.payment.reference, amountDecimal);
                    this.logger.log(`Refund of ${amountDecimal.toFixed(2)} initiated for customer ${dispute.userId} related to payment ${dispute.booking.payment.reference}.`);
                }
                else if (dto.refundToCustomer && !dispute.booking?.payment?.reference) {
                    this.logger.warn(`[${operation}] Refund requested for customer, but no payment reference found for booking ${dispute.bookingId}. Skipping external refund.`);
                }
                if (dto.debitMechanic && dispute.mechanicId && amountDecimal.greaterThan(0)) {
                    await this.walletService.debitWalletWithTx(tx, dispute.mechanicId, amountDecimal, 'DISPUTE_DEBIT', dispute.bookingId, { disputeId: dispute.id, resolution: dto.resolution });
                    this.logger.log(`Wallet debit of ${amountDecimal.toFixed(2)} processed for mechanic ${dispute.mechanicId}.`);
                }
            }
            catch (financialErr) {
                this.logger.error(`Financial operation failed during resolution: ${financialErr.message}`, financialErr.stack);
                throw new common_1.InternalServerErrorException(`Resolution failed: Financial transaction error (${financialErr.message}). Transaction rolled back.`);
            }
            const resolvedDispute = await this.disputeService.updateDisputeStatus(tx, disputeId, client_1.DisputeStatus.RESOLVED, dto.resolution, amountDecimal);
            this.logger.log(`✅ ${operation} completed successfully. Dispute ${disputeId} status: ${resolvedDispute.status}.`);
            return resolvedDispute;
        });
    }
    async refundPayment(paymentId, amount) {
        const operation = `Admin initiated refund for payment ID: ${paymentId} for amount ${amount}`;
        this.logger.log(`Starting: ${operation}`);
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where: { id: paymentId } });
            if (!payment) {
                throw new common_1.NotFoundException('Payment record not found.');
            }
            const amountDecimal = new decimal_js_1.Decimal(amount);
            if (amountDecimal.lessThanOrEqualTo(0) || amountDecimal.greaterThan(new decimal_js_1.Decimal(payment.amount).minus(payment.refundedAmount))) {
                throw new common_1.BadRequestException('Invalid refund amount. Must be positive and not exceed remaining refundable amount.');
            }
            const result = await this.paymentsService.refundPayment(tx, payment.reference, amountDecimal);
            this.logger.log(`✅ ${operation} completed successfully.`);
            return result;
        });
    }
    async listDisputes(query) {
        const { status, customerId, mechanicId, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (customerId)
            where.userId = customerId;
        if (mechanicId)
            where.mechanicId = mechanicId;
        const [disputes, total] = await this.prisma.$transaction([
            this.prisma.dispute.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: true, mechanic: true, booking: true },
            }),
            this.prisma.dispute.count({ where }),
        ]);
        return { data: disputes, total, page, limit };
    }
    async listWallets(query) {
        const { userId, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (userId)
            where.userId = userId;
        const [wallets, total] = await this.prisma.$transaction([
            this.prisma.wallet.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: true },
            }),
            this.prisma.wallet.count({ where }),
        ]);
        return { data: wallets, total, page, limit };
    }
    async getWalletDetail(walletId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            include: { user: true, WalletTransaction: { orderBy: { createdAt: 'desc' }, take: 20 } },
        });
        if (!wallet) {
            throw new common_1.NotFoundException(`Wallet with ID ${walletId} not found.`);
        }
        return wallet;
    }
    async listPayments(query) {
        const { userId, status, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (userId)
            where.userId = userId;
        if (status)
            where.status = status;
        const [payments, total] = await this.prisma.$transaction([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: true, booking: true },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return { data: payments, total, page, limit };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dispute_service_1.DisputeService,
        payments_services_1.PaymentsService,
        wallet_service_1.WalletService])
], AdminService);
//# sourceMappingURL=admin.service..js.map