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
var PaystackWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackWebhookController = void 0;
const common_1 = require("@nestjs/common");
const payment_services_1 = require("./payment.services");
let PaystackWebhookController = PaystackWebhookController_1 = class PaystackWebhookController {
    paymentService;
    logger = new common_1.Logger(PaystackWebhookController_1.name);
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async handlePaystackEvent(req, res) {
        try {
            const secret = process.env.PAYSTACK_SECRET_KEY;
            const payload = req.body;
            this.logger.log(`📬 Paystack webhook received: ${payload.event}`);
            if (payload.event === 'charge.success') {
                const reference = payload.data.reference;
                await this.paymentService.verify(reference);
            }
            res.status(200).send('ok');
        }
        catch (err) {
            this.logger.error('Webhook processing failed', err);
            res.status(500).send('Webhook error');
        }
    }
};
exports.PaystackWebhookController = PaystackWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaystackWebhookController.prototype, "handlePaystackEvent", null);
exports.PaystackWebhookController = PaystackWebhookController = PaystackWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks/paystack'),
    __metadata("design:paramtypes", [payment_services_1.PaymentService])
], PaystackWebhookController);
//# sourceMappingURL=flutterwave-webhook.controller.js.map