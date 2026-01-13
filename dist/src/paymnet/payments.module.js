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
const config_1 = require("@nestjs/config");
const payments_controller_1 = require("./payments.controller");
const flutterwave_gateway_1 = require("./strategy/flutterwave.gateway");
const paystack_gateway_1 = require("./strategy/paystack.gateway");
const prisma_service_1 = require("../../prisma/prisma.service");
const sandbox_gateway_1 = require("./strategy/sandbox.gateway");
const payment_services_1 = require("./payment.services");
const paystack_webhook_controller_1 = require("./paystack-webhook.controller");
const flutterwave_webhook_controller_1 = require("./flutterwave-webhook.controller");
const wallet_service_1 = require("../wallet/wallet.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const axios_1 = require("@nestjs/axios");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            common_1.HttpModule,
            config_1.ConfigModule,
        ],
        providers: [
            prisma_service_1.PrismaService,
            payment_services_1.PaymentService,
            wallet_service_1.WalletService,
            notification_gateway_1.NotificationGateway,
            {
                provide: 'IPaymentGateway',
                useFactory: (configService, httpService) => {
                    const gatewayName = configService.get('PAYMENT_GATEWAY')?.toUpperCase() || 'SANDBOX';
                    switch (gatewayName) {
                        case 'FLUTTERWAVE':
                            return new flutterwave_gateway_1.FlutterwaveGateway(configService, httpService);
                        case 'PAYSTACK':
                            return new paystack_gateway_1.PaystackGateway(configService, httpService);
                        case 'SANDBOX':
                            return new sandbox_gateway_1.SandboxGateway();
                        default:
                            return new sandbox_gateway_1.SandboxGateway();
                    }
                },
                inject: [config_1.ConfigService, axios_1.HttpService],
            },
        ],
        controllers: [
            payments_controller_1.PaymentController,
            paystack_webhook_controller_1.PaystackWebhookController,
            flutterwave_webhook_controller_1.FlutterwaveWebhookController,
        ],
        exports: [payment_services_1.PaymentService],
    })
], PaymentModule);
//# sourceMappingURL=payments.module.js.map