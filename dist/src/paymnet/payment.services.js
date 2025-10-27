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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const paystack_gateway_1 = require("./gateways/paystack.gateway");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    logger = new common_1.Logger(PaymentService_1.name);
    gateway;
    constructor(prisma) {
        this.prisma = prisma;
        this.gateway = new paystack_gateway_1.PaystackGateway(process.env.PAYSTACK_SECRET_KEY, process.env.PAYSTACK_BASE_URL);
    }
    async initiatePaymentForBooking(bookingId, amountKobo, metadata) {
        try {
            const payment = await this.prisma.payment.create({
                data: {
                    bookingId,
                    reference: `tmp-${Date.now()}`,
                    gateway: 'PAYSTACK',
                    amount: amountKobo,
                    status: 'INITIATED',
                },
            });
            const { reference, checkoutUrl } = await this.gateway.createCharge(amountKobo, 'NGN', { bookingId, ...metadata });
            const updated = await this.prisma.payment.update({
                where: { id: payment.id },
                data: { reference },
            });
            return { payment: updated, checkoutUrl };
        }
        catch (err) {
            this.logger.error('initiatePaymentForBooking error', err);
            throw new common_1.InternalServerErrorException('Failed to initiate payment');
        }
    }
    async verifyPayment(reference) {
        try {
            const gatewayResult = await this.gateway.verifyPayment(reference);
            const payment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!payment)
                throw new Error('Payment record not found');
            if (gatewayResult.success) {
                await this.prisma.payment.update({ where: { reference }, data: { status: 'SUCCESS', paidAt: new Date() } });
                await this.prisma.escrow.create({
                    data: {
                        bookingId: payment.bookingId,
                        amount: payment.amount,
                        status: 'HELD',
                    },
                });
            }
            else {
                await this.prisma.payment.update({ where: { reference }, data: { status: 'FAILED' } });
            }
            return gatewayResult;
        }
        catch (err) {
            this.logger.error('verifyPayment error', err);
            throw new common_1.InternalServerErrorException('Failed to verify payment');
        }
    }
    async partialRefund(reference, amount) {
        if (!this.gateway.partialRefund)
            throw new Error('Partial refund not supported by gateway');
        return this.gateway.partialRefund(reference, amount);
    }
    async capturePayment(paymentId) {
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.services.js.map