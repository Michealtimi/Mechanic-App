"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SandboxGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxGateway = void 0;
const common_1 = require("@nestjs/common");
let SandboxGateway = SandboxGateway_1 = class SandboxGateway {
    logger = new common_1.Logger(SandboxGateway_1.name);
    async initializePayment(args) {
        this.logger.log(`[SANDBOX] 🚀 Initializing mock payment for ${args.email}`);
        const reference = `SANDBOX_REF_${Date.now()}`;
        const mockPaymentUrl = `${args.metadata?.redirectUrl || 'https://yourapp.com/payment/callback'}?reference=${reference}&status=success`;
        return {
            paymentUrl: mockPaymentUrl,
            reference: reference,
        };
    }
    async verifyPayment(reference) {
        this.logger.log(`[SANDBOX] 🔍 Verifying mock transaction ${reference}`);
        const mockAmountKobo = 100000;
        return {
            status: 'success',
            amount: mockAmountKobo,
            raw: {
                sandbox_status: 'successful',
                sandbox_message: 'Mock transaction approved for testing.',
                reference: reference,
                amount: mockAmountKobo,
            },
        };
    }
    async createSubaccount(args) {
        this.logger.log(`[SANDBOX] 🏦 Creating mock subaccount for ${args.businessName}`);
        return {
            subaccountId: `SAB-${args.bankCode}-${Math.random().toString(36).substring(2, 8)}`
        };
    }
};
exports.SandboxGateway = SandboxGateway;
exports.SandboxGateway = SandboxGateway = SandboxGateway_1 = __decorate([
    (0, common_1.Injectable)()
], SandboxGateway);
//# sourceMappingURL=sandbox.gateway.js.map