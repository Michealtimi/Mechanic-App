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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_services_1 = require("./payment.services");
let PaymentController = class PaymentController {
    paymentService;
    RAW_BODY_KEY = 'rawBody';
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async initiatePayment() {
        const bookingId = 'mock-b-123';
        const userId = 'mock-u-456';
        const result = await this.paymentService.initializePayment(bookingId, userId);
        return {
            message: 'Payment initialized. Redirect user to the authorizationUrl.',
            ...result,
        };
    }
    async verifyPayment(reference) {
        if (!reference) {
            throw new common_1.BadRequestException('Transaction reference is required for verification.');
        }
        const verificationResult = await this.paymentService.verifyPayment(reference);
        return {
            message: 'Payment status retrieved.',
            status: verificationResult.status,
            amount: verificationResult.amount,
        };
    }
    async handleWebhook(paystackSignature, flutterwaveSignature, payload) {
        const signature = paystackSignature || flutterwaveSignature;
        await this.paymentService.handleWebhook(signature, payload);
        return { received: true };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('initiate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Get)('verify'),
    __param(0, (0, common_1.Query)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)('x-paystack-signature')),
    __param(1, (0, common_1.Headers)('verif-hash')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [payment_services_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map