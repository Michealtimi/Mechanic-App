"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const payment_controller_1 = require("./payment.controller");
const flutterwave_gateway_1 = require("./strategy/flutterwave.gateway");
const paystack_gateway_1 = require("./strategy/paystack.gateway");
const prisma_service_1 = require("../../prisma/prisma.service");
const sandbox_gateway_1 = require("./strategy/sandbox.gateway");
const payment_services_1 = require("./payment.services");
const paystack_webhook_controller_1 = require("./paystack-webhook.controller");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        providers: [
            prisma_service_1.PrismaService,
            payment_services_1.PaymentService,
            {
                provide: 'IPaymentGateway',
                useFactory: () => {
                    const gateway = process.env.PAYMENT_GATEWAY?.toUpperCase() || 'SANDBOX';
                    switch (gateway) {
                        case 'FLUTTERWAVE':
                            return new flutterwave_gateway_1.FlutterwaveGateway();
                        case 'PAYSTACK':
                            return new paystack_gateway_1.PaystackGateway();
                        case 'SANDBOX':
                            return new sandbox_gateway_1.SandboxGateway();
                        default:
                            return new sandbox_gateway_1.SandboxGateway();
                    }
                },
            },
        ],
        controllers: [
            payment_controller_1.PaymentController,
            paystack_webhook_controller_1.PaystackWebhookController,
            flutter
        ],
        exports: [payment_services_1.PaymentService],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map