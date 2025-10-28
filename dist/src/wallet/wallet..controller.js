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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const swagger_1 = require("@nestjs/swagger");
class JwtAuthGuard {
}
class DebitWalletDto {
    amount;
    type;
    bookingId;
}
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async ensureUserWallet(req) {
        const userId = req.user?.id || 'TEST_USER_ID';
        return this.walletService.ensureWallet(userId);
    }
    async getMyWallet(req) {
        const userId = req.user?.id || 'TEST_USER_ID';
        const wallet = await this.walletService.getWallet(userId);
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found for this user. Consider calling /wallet/ensure.');
        }
        return wallet;
    }
    async creditMechanic(mechanicId, amount, bookingId) {
        if (!amount || amount <= 0) {
            throw new common_1.BadRequestException('Credit amount must be a positive number.');
        }
        return this.walletService.creditMechanic(mechanicId, amount, bookingId);
    }
    async debitWallet(req, dto) {
        const userId = req.user?.id || 'TEST_USER_ID';
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Debit amount must be a positive number.');
        }
        try {
            return await this.walletService.debitWallet(userId, dto.amount, dto.type, dto.bookingId);
        }
        catch (e) {
            if (e instanceof common_1.InternalServerErrorException && e.message.includes('Insufficient balance')) {
                throw new common_1.BadRequestException('Insufficient funds in wallet.');
            }
            throw e;
        }
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('ensure'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Guarantees wallet existence for the authenticated user.',
        description: 'Creates a wallet if one does not exist for the user, otherwise returns the existing wallet. Idempotent operation.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet created or retrieved successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "ensureUserWallet", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve the authenticated user\'s wallet details and transaction history.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet retrieved successfully.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Post)('credit/:mechanicId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'INTERNAL/SYSTEM: Credit a mechanic\'s wallet. Amount in kobo/cents.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet credited successfully.' }),
    __param(0, (0, common_1.Param)('mechanicId')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "creditMechanic", null);
__decorate([
    (0, common_1.Post)('debit'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'INTERNAL/SYSTEM: Debit the authenticated user\'s wallet.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet debited successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient balance or bad request.' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, DebitWalletDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "debitWallet", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet..controller.js.map