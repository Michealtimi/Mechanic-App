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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_js_1 = require("decimal.js");
let WalletService = WalletService_1 = class WalletService {
    prisma;
    logger = new common_1.Logger(WalletService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureWallet(userId, tx) {
        const client = tx || this.prisma;
        let wallet = await client.wallet.findUnique({ where: { userId } });
        if (wallet)
            return wallet;
        try {
            wallet = await client.wallet.create({ data: { userId, balance: new decimal_js_1.Decimal(0), pending: new decimal_js_1.Decimal(0) } });
            return wallet;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return await client.wallet.findUniqueOrThrow({ where: { userId } });
            }
            throw error;
        }
    }
    async creditWalletWithTx(tx, userId, amount, type = 'CREDIT', bookingId, metadata) {
        const operation = `Credit user ${userId} with ${amount.toFixed(2)}`;
        try {
            const wallet = await this.ensureWallet(userId, tx);
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } }
            });
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    bookingId,
                    type,
                    amount,
                    balanceAfter: updatedWallet.balance,
                    metadata,
                },
            });
            this.logger.log(`✅ ${operation} successful. New balance: ${updatedWallet.balance.toFixed(2)}`);
            return updatedWallet;
        }
        catch (err) {
            this.logger.error(`${operation} failed.`, err.stack);
            throw new common_1.InternalServerErrorException('Failed to complete credit transaction', err.message);
        }
    }
    async creditMechanic(mechanicId, amount, bookingId, metadata) {
        return this.prisma.$transaction(async (tx) => {
            return this.creditWalletWithTx(tx, mechanicId, amount, 'CREDIT', bookingId, metadata);
        });
    }
    async creditMechanicInTransaction(tx, mechanicId, amount, bookingId, metadata) {
        return this.creditWalletWithTx(tx, mechanicId, amount, 'CREDIT', bookingId, metadata);
    }
    async debitWalletWithTx(tx, userId, amount, type, bookingId, metadata) {
        const operation = `Debit user ${userId} with ${amount.toFixed(2)}`;
        try {
            const wallet = await this.ensureWallet(userId, tx);
            const currentWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
            if (currentWallet.balance.lessThan(amount)) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } }
            });
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    bookingId,
                    type,
                    amount: amount.neg(),
                    balanceAfter: updatedWallet.balance,
                    metadata,
                },
            });
            this.logger.log(`✅ ${operation} successful. New balance: ${updatedWallet.balance.toFixed(2)}`);
            return updatedWallet;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException && err.message === 'Insufficient balance') {
                throw new common_1.BadRequestException('Wallet debit failed: Insufficient funds.');
            }
            this.logger.error(`${operation} failed.`, err.stack);
            throw new common_1.InternalServerErrorException('Failed to debit wallet', err.message);
        }
    }
    async debitWallet(userId, amount, type = 'DEBIT', bookingId, metadata) {
        return this.prisma.$transaction(async (tx) => {
            return this.debitWalletWithTx(tx, userId, amount, type, bookingId, metadata);
        });
    }
    async getWallet(userId) {
        return this.prisma.wallet.findUnique({
            where: { userId },
            include: { WalletTransaction: true }
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map