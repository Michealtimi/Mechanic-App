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
    async creditMechanic(mechanicId, amount, bookingId, metadata) {
        try {
            const wallet = await this.ensureWallet(mechanicId);
            const newBalance = wallet.balance + amount;
            const tx = await this.prisma.$transaction([
                this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
                this.prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        bookingId,
                        type: 'CREDIT',
                        amount,
                        balanceAfter: newBalance,
                        metadata,
                    },
                }),
            ]);
            return tx[0];
        }
        catch (err) {
            this.logger.error('creditMechanic error', err);
            throw new common_1.InternalServerErrorException('Failed to credit mechanic');
        }
    }
    async debitWallet(userId, amount, type = 'DEBIT', bookingId) {
        try {
            const wallet = await this.ensureWallet(userId);
            if (wallet.balance < amount)
                throw new Error('Insufficient balance');
            const newBalance = wallet.balance - amount;
            const tx = await this.prisma.$transaction([
                this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } }),
                this.prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        bookingId,
                        type,
                        amount,
                        balanceAfter: newBalance,
                    },
                }),
            ]);
            return tx[0];
        }
        catch (err) {
            this.logger.error('debitWallet error', err);
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