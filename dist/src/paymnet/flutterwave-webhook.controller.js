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
var FlutterwaveWebhookController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveWebhookController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
let FlutterwaveWebhookController = FlutterwaveWebhookController_1 = class FlutterwaveWebhookController {
    paymentsService;
    logger = new common_1.Logger(FlutterwaveWebhookController_1.name);
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async handleFlutterwaveWebhook(signature, req) {
        this.logger.log('Received Flutterwave webhook.');
        if (!signature) {
            this.logger.warn('Flutterwave webhook received without verif-hash signature.');
            throw new common_1.ForbiddenException('Flutterwave signature missing.');
        }
        if (!req.rawBody) {
            this.logger.error('Raw body not available for Flutterwave webhook. Check NestJS config.');
            throw new common_1.ForbiddenException('Raw body not available for signature verification.');
        }
        try {
            await this.paymentsService.handleFlutterwaveWebhook(signature, req.rawBody);
            this.logger.log('Flutterwave webhook processed successfully.');
            return { received: true, message: 'Webhook processed successfully' };
        }
        catch (error) {
            this.logger.error(`Error processing Flutterwave webhook: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.FlutterwaveWebhookController = FlutterwaveWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)('verif-hash')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FlutterwaveWebhookController.prototype, "handleFlutterwaveWebhook", null);
exports.FlutterwaveWebhookController = FlutterwaveWebhookController = FlutterwaveWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks/flutterwave'),
    __metadata("design:paramtypes", [typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object])
], FlutterwaveWebhookController);
//# sourceMappingURL=flutterwave-webhook.controller.js.map