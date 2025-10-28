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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const paystack_gateway_1 = require("./strategy/paystack.gateway");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    gateway;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.logger.log(`Active Payment Gateway: ${this.gateway.constructor.name}`);
    }
    async initializePayment(bookingId, userId) {
        const operation = `Initialize payment for booking ${bookingId}`;
        try {
            this.logger.log(`Starting: ${operation}`);
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: { customer: true, payment: true },
            });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.payment?.status === 'SUCCESS') {
                throw new common_1.BadRequestException('Payment for this booking has already been completed.');
            }
            if (!booking.customer?.email) {
                throw new common_1.InternalServerErrorException('Customer email missing for payment initiation.');
            }
            const reference = `BK-${Date.now()}-${booking.id}`;
            const amount = booking.price * 100;
            const gatewayResponse = await this.gateway.initializePayment({
                amount,
                email: booking.customer.email,
                metadata: { bookingId, userId, reference },
            });
            await this.prisma.payment.create({
                data: {
                    bookingId,
                    reference: gatewayResponse.reference,
                    amount: booking.price,
                    status: 'PENDING',
                    method: this.gateway.constructor.name,
                },
            });
            this.logger.log(`✅ Payment initialized successfully: ${gatewayResponse.reference}`);
            return { paymentUrl: gatewayResponse.paymentUrl, reference: gatewayResponse.reference };
        }
        catch (err) {
            this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to initialize payment via gateway');
        }
    }
    async verifyPayment(reference) {
        const operation = `Verify payment ${reference}`;
        try {
            this.logger.log(`Starting: ${operation}`);
            const existing = await this.prisma.payment.findUnique({ where: { reference } });
            if (!existing)
                throw new common_1.NotFoundException('Payment record not found');
            if (existing.status === 'SUCCESS') {
                this.logger.warn(`Verification called for successful payment: ${reference}`);
                throw new common_1.BadRequestException('Payment has already been successfully verified.');
            }
            const verification = await this.gateway.verifyPayment(reference);
            const status = verification.status.toUpperCase();
            if (status !== 'SUCCESS') {
                await this.prisma.payment.update({
                    where: { reference },
                    data: { status: status === 'FAILED' ? 'FAILED' : 'PENDING' },
                });
                this.logger.warn(`Verification failed for ${reference}. Status: ${status}`);
                throw new common_1.ForbiddenException(`Payment not successful. Status: ${status}`);
            }
            await this.prisma.payment.update({
                where: { reference },
                data: {
                    status,
                    verifiedAt: new Date(),
                },
            });
            this.logger.log(`✅ Payment verified successfully: ${reference}`);
            return verification;
        }
        catch (err) {
            this.logger.error(`❌ Verification failed: ${operation}. ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Verification failed due to an unknown server error');
        }
    }
    async handleWebhook(signature, rawBody) {
        const operation = `Handle webhook event`;
        try {
            this.logger.log(`Processing: ${operation}`);
            const payload = JSON.parse(rawBody.toString('utf-8'));
            const reference = payload.data?.reference || payload.reference;
            if (!reference) {
                throw new common_1.BadRequestException('Webhook payload missing transaction reference.');
            }
            if (this.gateway instanceof paystack_gateway_1.PaystackGateway) {
                if (!this.gateway.verifyWebhookSignature(signature, rawBody)) {
                    this.logger.error('❌ Webhook signature verification failed.', { signature });
                    throw new common_1.ForbiddenException('Invalid webhook signature.');
                }
            }
            else {
            }
            try {
                await this.verifyPayment(reference);
            }
            catch (e) {
                if (e.status !== 403) {
                    throw e;
                }
            }
            this.logger.log(`✅ Webhook successfully processed for ${reference}`);
            return { success: true };
        }
        catch (err) {
            this.logger.error(`❌ Webhook failed: ${operation}`, err.stack);
            throw new common_1.InternalServerErrorException('Webhook processing failed');
        }
    }
    async capturePayment(bookingId) {
        this.logger.log(`[capturePayment] Placeholder for capturing payment for booking: ${bookingId}`);
    }
    async partialRefund(bookingId, amount) {
        this.logger.log(`[partialRefund] Placeholder for refunding ${amount} for booking: ${bookingId}`);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IPaymentGateway')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], PaymentService);
//# sourceMappingURL=payment.services.js.map