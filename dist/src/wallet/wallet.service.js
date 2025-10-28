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
const prisma_service_1 = require("../../prisma/prisma.service");
let WalletService = WalletService_1 = class WalletService {
    prisma;
    logger = new common_1.Logger(WalletService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureWallet(userId) {
        const existing = await this.prisma.wallet.findUnique({ where: { userId } });
        if (existing)
            return existing;
        return this.prisma.wallet.create({ data: { userId, balance: 0, pending: 0 } });
    }
    async creditWallet(userId, amount, type = 'CREDIT', bookingId, metadata) {
        const operation = `Credit user ${userId} with ${amount}`;
        try {
            const wallet = await this.ensureWallet(userId);
            const txResult = await this.prisma.$transaction(async (prisma) => {
                const updatedWallet = await prisma.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: amount } }
                });
                const newTransaction = await prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        bookingId,
                        type,
                        amount,
                        balanceAfter: updatedWallet.balance,
                        metadata,
                    },
                });
                return { updatedWallet, newTransaction };
            });
            this.logger.log(`✅ ${operation} successful. New balance: ${txResult.updatedWallet.balance}`);
            return txResult.updatedWallet;
        }
        catch (err) {
            this.logger.error(`${operation} failed.`, err);
            throw new common_1.InternalServerErrorException('Failed to complete credit transaction');
        }
    }
    async creditMechanic(mechanicId, amount, bookingId, metadata) {
        return this.creditWallet(mechanicId, amount, 'CREDIT', bookingId, metadata);
    }
    async debitWallet(userId, amount, type = 'DEBIT', bookingId) {
        const operation = `Debit user ${userId} with ${amount}`;
        try {
            const wallet = await this.ensureWallet(userId);
            const txResult = await this.prisma.$transaction(async (prisma) => {
                const currentWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
                if (currentWallet.balance < amount) {
                    throw new common_1.BadRequestException('Insufficient balance');
                }
                const updatedWallet = await prisma.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: amount } }
                });
                const newTransaction = await prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        bookingId,
                        type,
                        amount,
                        balanceAfter: updatedWallet.balance,
                    },
                });
                return { updatedWallet, newTransaction };
            });
            this.logger.log(`✅ ${operation} successful. New balance: ${txResult.updatedWallet.balance}`);
            return txResult.updatedWallet;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException && err.message === 'Insufficient balance') {
                throw new common_1.BadRequestException('Wallet debit failed: Insufficient funds.');
            }
            this.logger.error(`${operation} failed.`, err);
            throw new common_1.InternalServerErrorException('Failed to debit wallet');
        }
    }
    async getWallet(userId) {
        return this.prisma.wallet.findUnique({ where: { userId }, include: { WalletTransaction: true } });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map