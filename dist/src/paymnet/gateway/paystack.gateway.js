"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackGateway = void 0;
const axios_1 = require("axios");
class PaystackGateway {
    secretKey;
    baseUrl;
    constructor(secretKey, baseUrl) {
        this.secretKey = secretKey;
        this.baseUrl = baseUrl;
    }
    async createCharge(amount, currency, metadata) {
        const res = await axios_1.default.post(`${this.baseUrl}/transaction/initialize`, {
            amount,
            currency,
            metadata,
        }, { headers: { Authorization: `Bearer ${this.secretKey}` } });
        return { reference: res.data.data.reference, checkoutUrl: res.data.data.authorization_url };
    }
    async verifyPayment(reference) {
        const res = await axios_1.default.get(`${this.baseUrl}/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${this.secretKey}` },
        });
        const data = res.data.data;
        return { success: data.status === 'success', reference: data.reference, amount: data.amount, gatewayResponse: data };
    }
    async initiatePayout(beneficiaryDetails, amount) {
        return { success: false };
    }
}
exports.PaystackGateway = PaystackGateway;
//# sourceMappingURL=paystack.gateway.js.map