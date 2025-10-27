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
exports.PaymentWebhookController = void 0;
const common_1 = require("@nestjs/common");
const payment_services_1 = require("./payment.services");
let PaymentWebhookController = class PaymentWebhookController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async handleWebhook(req, res) {
        await this.paymentService.handleWebhook(req.body);
        return res.status(200).send({ received: true });
    }
};
exports.PaymentWebhookController = PaymentWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentWebhookController.prototype, "handleWebhook", null);
exports.PaymentWebhookController = PaymentWebhookController = __decorate([
    (0, common_1.Controller)('webhooks/paystack'),
    __metadata("design:paramtypes", [payment_services_1.PaymentService])
], PaymentWebhookController);
//# sourceMappingURL=paystack-webhook.controller.js.map