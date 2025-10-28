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
var FlutterwaveGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveGateway = void 0;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
let FlutterwaveGateway = FlutterwaveGateway_1 = class FlutterwaveGateway {
    logger = new common_1.Logger(FlutterwaveGateway_1.name);
    baseUrl = 'https://api.flutterwave.com/v3';
    secret = process.env.FLW_SECRET_KEY;
    currency = 'NGN';
    constructor() {
        if (!this.secret) {
            this.logger.error('FLW_SECRET_KEY is not defined.');
            throw new common_1.InternalServerErrorException('Flutterwave configuration missing.');
        }
    }
    headers() {
        return { Authorization: `Bearer ${this.secret}` };
    }
    handleError(operation, error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const status = axiosError.response?.status;
            const message = axiosError.response?.data?.message || axiosError.message;
            this.logger.error(`❌ ${operation} failed (HTTP ${status}): ${message}`, {
                stack: axiosError.stack,
                response_data: axiosError.response?.data,
                request_url: axiosError.config?.url,
            });
            if (status === 400)
                throw new common_1.BadRequestException(`Flutterwave error: ${message}`);
            if (status === 404)
                throw new common_1.NotFoundException(`Flutterwave error: ${message}`);
            throw new common_1.InternalServerErrorException(`Flutterwave service error: ${message}`);
        }
        this.logger.error(`❌ ${operation} failed (Non-Axios Error): ${String(error)}`, error.stack);
        throw new common_1.InternalServerErrorException(`An unexpected error occurred during ${operation}.`);
    }
    async initializePayment({ amount, email, metadata }) {
        const operation = 'Flutterwave Initialize Payment';
        const amountInCurrency = Math.round(amount / 100);
        try {
            this.logger.log(`🚀 ${operation} for ${email}`);
            const response = await axios_1.default.post(`${this.baseUrl}/payments`, {
                tx_ref: `FLW-${Date.now()}`,
                amount: amountInCurrency,
                currency: this.currency,
                redirect_url: metadata?.redirectUrl || 'https://yourapp.com/payment/callback',
                customer: { email },
                meta: metadata,
            }, { headers: this.headers() });
            return Promise.resolve({
                paymentUrl: response.data.data.link,
                reference: response.data.data.tx_ref,
            });
        }
        catch (err) {
            this.handleError(operation, err);
        }
    }
    async verifyPayment(reference) {
        const operation = `Flutterwave Verify ${reference}`;
        try {
            this.logger.log(`🔍 ${operation}`);
            const res = await axios_1.default.get(`${this.baseUrl}/transactions/${reference}/verify`, {
                headers: this.headers(),
            });
            const data = res.data.data;
            let status = 'pending';
            if (data.status === 'successful')
                status = 'success';
            else if (data.status === 'failed')
                status = 'failed';
            return Promise.resolve({
                status,
                amount: Math.round(data.amount * 100),
                raw: data,
            });
        }
        catch (err) {
            this.handleError(operation, err);
        }
    }
    async createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }) {
        const operation = `Flutterwave Create Subaccount for ${businessName}`;
        try {
            this.logger.log(`🏦 ${operation}`);
            const splitValue = Math.round(percentageCharge * 100);
            const res = await axios_1.default.post(`${this.baseUrl}/subaccounts`, {
                account_bank: bankCode,
                account_number: accountNumber,
                business_name: businessName,
                split_type: 'percentage',
                split_value: splitValue,
            }, { headers: this.headers() });
            return Promise.resolve({ subaccountId: res.data.data.id });
        }
        catch (err) {
            this.handleError(operation, err);
        }
    }
};
exports.FlutterwaveGateway = FlutterwaveGateway;
exports.FlutterwaveGateway = FlutterwaveGateway = FlutterwaveGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FlutterwaveGateway);
//# sourceMappingURL=flutterwave.gateway.js.map