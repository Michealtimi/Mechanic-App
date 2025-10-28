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
var PaystackGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackGateway = void 0;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let PaystackGateway = PaystackGateway_1 = class PaystackGateway {
    logger = new common_1.Logger(PaystackGateway_1.name);
    baseUrl = 'https://api.paystack.co';
    secret = process.env.PAYSTACK_SECRET_KEY;
    constructor() {
        this.secret = process.env.PAYSTACK_SECRET_KEY;
        if (!this.secret) {
            this.logger.error('PAYSTACK_SECRET_KEY is not defined. Gateway cannot function.');
            throw new common_1.InternalServerErrorException('Payment gateway configuration is missing.');
        }
    }
    handlePaystackError(operation, error) {
        if (axios_1.default.isAxiosError(error)) {
            const status = (error.response?.status) ?? 500;
            const message = error.response?.data?.message || error.message;
            this.logger.error(`❌ ${operation} failed (HTTP ${status}): ${message}`, error.stack);
            if (status === 400) {
                throw new common_1.BadRequestException(`Paystack error: ${message}`);
            }
            if (status === 404) {
                throw new common_1.NotFoundException(`Paystack error: ${message}`);
            }
            if (status === 401 || status === 403) {
                throw new common_1.InternalServerErrorException('Paystack configuration error. Check API key.');
            }
            throw new common_1.InternalServerErrorException(`Paystack service unavailable: ${message}`);
        }
        this.logger.error(`❌ Unknown error during ${operation}: ${error}`, error);
        throw new common_1.InternalServerErrorException(`An unexpected error occurred during ${operation}.`);
    }
    verifyWebhookSignature(signature, rawBody) {
        if (!this.secret) {
            throw new common_1.InternalServerErrorException('Paystack secret key is not configured for webhook verification.');
        }
        const hash = crypto
            .createHmac('sha512', this.secret)
            .update(rawBody)
            .digest('hex');
        return hash === signature;
    }
    async initializePayment({ amount, email, metadata }) {
        const operation = 'Initialize Payment';
        try {
            this.logger.log(`🚀 ${operation} for ${email}`);
            const res = await axios_1.default.post(`${this.baseUrl}/transaction/initialize`, { amount, email, metadata }, { headers: { Authorization: `Bearer ${this.secret}` } });
            if (!res.data.status || !res.data.data) {
                throw new common_1.InternalServerErrorException('Paystack initialization response invalid.');
            }
            return {
                paymentUrl: res.data.data.authorization_url,
                reference: res.data.data.reference,
            };
        }
        catch (err) {
            this.handlePaystackError(operation, err);
        }
    }
    async verifyPayment(reference) {
        const operation = `Verify Payment Reference ${reference}`;
        try {
            this.logger.log(`🔍 ${operation}`);
            const res = await axios_1.default.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${this.secret}` },
            });
            const data = res.data.data;
            let status;
            if (data.status === 'success') {
                status = 'success';
            }
            else if (data.status === 'failed' || data.status === 'abandoned') {
                status = 'failed';
            }
            else {
                status = 'pending';
            }
            return {
                status: status,
                amount: data.amount,
                raw: data,
            };
        }
        catch (err) {
            this.handlePaystackError(operation, err);
        }
    }
    async createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }) {
        const operation = `Create Subaccount for ${businessName}`;
        try {
            this.logger.log(`🏦 ${operation}`);
            const res = await axios_1.default.post(`${this.baseUrl}/subaccount`, {
                business_name: businessName,
                settlement_bank: bankCode,
                account_number: accountNumber,
                percentage_charge: percentageCharge,
                primary_contact_email: 'noreply@yourbusiness.com'
            }, { headers: { Authorization: `Bearer ${this.secret}` } });
            if (!res.data.status || !res.data.data) {
                throw new common_1.InternalServerErrorException('Paystack subaccount creation response invalid.');
            }
            return { subaccountId: res.data.data.subaccount_code };
        }
        catch (err) {
            this.handlePaystackError(operation, err);
        }
    }
};
exports.PaystackGateway = PaystackGateway;
exports.PaystackGateway = PaystackGateway = PaystackGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaystackGateway);
//# sourceMappingURL=paystack.gateway.js.map