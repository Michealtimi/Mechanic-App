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
var PayoutService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const payments_service_1 = require("src/modules/payment/payments.service");
const decimal_js_1 = require("decimal.js");
const client_1 = require("@prisma/client");
let PayoutService = PayoutService_1 = class PayoutService {
    prisma;
    walletService;
    paymentsService;
    logger = new common_1.Logger(PayoutService_1.name);
    constructor(prisma, walletService, paymentsService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.paymentsService = paymentsService;
    }
    async requestPayout(mechanicId, dto) {
        const operation = `Request payout for mechanic ${mechanicId} for amount ${dto.amount}`;
        this.logger.log(`Starting: ${operation}`);
        return this.prisma.$transaction(async (tx) => {
            let payoutRecord = null;
            try {
                const mechanic = await tx.user.findUnique({
                    where: { id: mechanicId },
                    select: { id: true, role: true },
                });
                if (!mechanic || mechanic.role !== 'MECHANIC') {
                    this.logger.warn(`[${operation}] Mechanic with ID ${mechanicId} not found or is not a mechanic.`);
                    throw new common_1.NotFoundException('Mechanic not found or not eligible for payouts.');
                }
                const wallet = await this.walletService.ensureWallet(mechanicId, tx);
                const amountDecimal = new decimal_js_1.Decimal(dto.amount);
                if (wallet.balance.lessThan(amountDecimal)) {
                    throw new common_1.BadRequestException('Insufficient balance for payout request.');
                }
                payoutRecord = await tx.payout.create({
                    data: {
                        mechanicId,
                        walletId: wallet.id,
                        amount: amountDecimal,
                        status: client_1.PayoutStatus.PENDING,
                        bankAccountNumber: dto.bankAccountNumber,
                        bankCode: dto.bankCode,
                        bankName: dto.bankName,
                        accountName: dto.accountName,
                        metadata: {},
                    },
                });
                this.logger.log(`Payout record ${payoutRecord.id} created with status ${payoutRecord.status}.`);
                await this.walletService.debitWalletWithTx(tx, mechanicId, amountDecimal, 'PAYOUT_REQUEST', undefined, {
                    payoutId: payoutRecord.id,
                    bankAccountNumber: dto.bankAccountNumber,
                    bankCode: dto.bankCode,
                });
                this.logger.log(`Wallet ${wallet.id} debited by ${amountDecimal.toFixed(2)} for payout ${payoutRecord.id}.`);
                let transferResult;
                try {
                    transferResult = await this.paymentsService.initiatePayoutTransfer(mechanicId, amountDecimal, dto.bankAccountNumber, dto.bankCode, payoutRecord.id, dto.bankName, dto.accountName);
                    this.logger.log(`Gateway transfer initiated for payout ${payoutRecord.id}. Gateway ref: ${transferResult.providerRef || 'N/A'}. Success: ${transferResult.success}`);
                }
                catch (gatewayErr) {
                    this.logger.error(`[${operation}] Gateway transfer initiation failed for payout ${payoutRecord.id}: ${gatewayErr.message}`, gatewayErr.stack);
                    transferResult = {
                        success: false,
                        message: gatewayErr.message || 'Gateway initiation failed',
                        rawGatewayResponse: gatewayErr.response || gatewayErr,
                    };
                }
                const newStatusOnGatewayResult = transferResult.success ? client_1.PayoutStatus.PROCESSING : client_1.PayoutStatus.FAILED;
                const updatedPayout = await tx.payout.update({
                    where: { id: payoutRecord.id },
                    data: {
                        status: newStatusOnGatewayResult,
                        providerRef: transferResult.providerRef,
                        rawGatewayResponse: transferResult.rawGatewayResponse,
                        failureReason: transferResult.message,
                        updatedAt: new Date(),
                    },
                });
                this.logger.log(`Payout ${updatedPayout.id} status updated to ${updatedPayout.status} after gateway initiation.`);
                if (!transferResult.success) {
                    this.logger.warn(`[${operation}] Immediate gateway failure for payout ${payoutRecord.id}. Re-crediting wallet.`);
                    await this.walletService.creditWalletWithTx(tx, mechanicId, amountDecimal, 'PAYOUT_FAILED_REVERSAL', undefined, { payoutId: payoutRecord.id, failureReason: transferResult.message });
                    this.logger.log(`Re-credited wallet ${wallet.id} with ${amountDecimal.toFixed(2)} due to immediate gateway failure for payout ${payoutRecord.id}.`);
                }
                return { success: transferResult.success, message: transferResult.message, data: updatedPayout };
            }
            catch (err) {
                this.logger.error(`${operation} failed: ${err.message}`, err.stack);
                if (err instanceof common_1.BadRequestException || err instanceof common_1.NotFoundException) {
                    throw err;
                }
                throw new common_1.InternalServerErrorException('Payout request failed due to an unexpected error.', err.message);
            }
        });
    }
    async markPayoutResult(payoutId, updateDto) {
        const { status, providerRef, failureReason, rawGatewayResponse } = updateDto;
        const operation = `Mark payout ${payoutId} as ${status}`;
        this.logger.log(`Starting: ${operation}. Provider Ref: ${providerRef || 'N/A'}`);
        return this.prisma.$transaction(async (tx) => {
            const payout = await tx.payout.findUnique({
                where: { id: payoutId },
                include: { wallet: true, mechanic: true },
            });
            if (!payout) {
                throw new common_1.NotFoundException(`Payout with ID ${payoutId} not found.`);
            }
            if (payout.status === client_1.PayoutStatus.COMPLETED ||
                payout.status === client_1.PayoutStatus.FAILED ||
                payout.status === client_1.PayoutStatus.REVERSED ||
                payout.status === client_1.PayoutStatus.CANCELLED) {
                this.logger.warn(`${operation} already has final status ${payout.status}. Skipping update.`);
                return payout;
            }
            const updatedPayout = await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status,
                    providerRef: providerRef || payout.providerRef,
                    failureReason: failureReason || payout.failureReason,
                    rawGatewayResponse: rawGatewayResponse || payout.rawGatewayResponse,
                    updatedAt: new Date(),
                },
            });
            this.logger.log(`Payout ${payoutId} updated to ${status}.`);
            if ((status === client_1.PayoutStatus.FAILED || status === client_1.PayoutStatus.REVERSED) &&
                (payout.status !== client_1.PayoutStatus.FAILED && payout.status !== client_1.PayoutStatus.REVERSED)) {
                if (!payout.mechanicId) {
                    this.logger.error(`Payout ${payoutId} failed/reversed, but no mechanicId found to re-credit.`);
                    throw new common_1.InternalServerErrorException('Cannot re-credit wallet: no mechanic associated with payout.');
                }
                const amountToReCredit = new decimal_js_1.Decimal(payout.amount);
                await this.walletService.creditWalletWithTx(tx, payout.mechanicId, amountToReCredit, status === client_1.PayoutStatus.FAILED ? 'PAYOUT_REVERSAL_FAILED' : 'PAYOUT_REVERSAL_REVERSED', undefined, { payoutId: payout.id, failureReason: failureReason || 'Gateway failure (webhook)' });
                this.logger.log(`Re-credited wallet for mechanic ${payout.mechanicId} with ${amountToReCredit.toFixed(2)} due to ${status} payout ${payoutId}.`);
            }
            return updatedPayout;
        });
    }
    async getPayout(payoutId) {
        return this.prisma.payout.findUnique({
            where: { id: payoutId },
            include: { wallet: true, mechanic: true },
        });
    }
    async listPayouts(filters) {
        const { mechanicId, status, page, limit } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (mechanicId)
            where.mechanicId = mechanicId;
        if (status)
            where.status = status;
        const [payouts, total] = await this.prisma.$transaction([
            this.prisma.payout.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { mechanic: true, wallet: true },
            }),
            this.prisma.payout.count({ where }),
        ]);
        return { data: payouts, total, page, limit };
    }
};
exports.PayoutService = PayoutService;
exports.PayoutService = PayoutService = PayoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService, typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object])
], PayoutService);
//# sourceMappingURL=payouts.service.js.map