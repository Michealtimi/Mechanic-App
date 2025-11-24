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
const decimal_js_1 = require("decimal.js");
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
                include: { customer: true, payment: true, mechanic: true },
            });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.payment?.status === 'SUCCESS') {
                throw new common_1.BadRequestException('Payment for this booking has already been completed.');
            }
            if (!booking.customer?.email) {
                throw new common_1.InternalServerErrorException('Customer email missing for payment initiation.');
            }
            if (!booking.price) {
                throw new common_1.InternalServerErrorException('Booking price is missing for payment initiation.');
            }
            const reference = `BK-${Date.now()}-${booking.id}`;
            const amountInSmallestUnit = new decimal_js_1.Decimal(booking.price).mul(100).toNumber();
            const gatewayResponse = await this.gateway.initializePayment({
                amount: amountInSmallestUnit,
                email: booking.customer.email,
                metadata: { bookingId, userId, reference },
            });
            await this.prisma.payment.create({
                data: {
                    bookingId: bookingId,
                    userId: userId,
                    reference: gatewayResponse.reference,
                    amount: new decimal_js_1.Decimal(booking.price),
                    status: 'PENDING',
                    gateway: this.gateway.getGatewayName(),
                    rawGatewayResponse: gatewayResponse.raw,
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
            throw new common_1.InternalServerErrorException('Failed to initialize payment via gateway', err.message);
        }
    }
    async verifyPayment(reference, overrideGateway) {
        const operation = `Verify payment ${reference}`;
        try {
            this.logger.log(`Starting: ${operation}`);
            const existingPayment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!existingPayment)
                throw new common_1.NotFoundException('Payment record not found');
            if (existingPayment.status === 'SUCCESS') {
                this.logger.warn(`Verification called for successful payment: ${reference}. Returning existing success.`);
                return {
                    status: 'SUCCESS',
                    message: 'Payment already successfully verified.',
                    raw: existingPayment.rawGatewayResponse
                };
            }
            const activeGateway = overrideGateway || this.gateway;
            if (existingPayment.gateway !== activeGateway.getGatewayName()) {
                this.logger.warn(`Gateway mismatch for verification. Stored: ${existingPayment.gateway}, Active: ${activeGateway.getGatewayName()}`);
            }
            const verification = await activeGateway.verifyPayment(reference);
            return await this.prisma.$transaction(async (tx) => {
                const status = verification.status.toUpperCase();
                let updatedPayment;
                if (status === 'SUCCESS') {
                    const expectedAmount = new decimal_js_1.Decimal(existingPayment.amount).mul(100).toNumber();
                    if (verification.amount !== expectedAmount) {
                        this.logger.error(`Amount mismatch for ${reference}. Expected: ${expectedAmount}, Received: ${verification.amount}`);
                        throw new common_1.BadRequestException('Amount mismatch during verification. Possible fraud.');
                    }
                    updatedPayment = await tx.payment.update({
                        where: { reference },
                        data: {
                            status,
                            verifiedAt: new Date(),
                            rawGatewayResponse: verification.raw,
                        },
                    });
                    this.logger.log(`✅ Payment verified successfully: ${reference}`);
                    await this.triggerPostPaymentActions(tx, updatedPayment.id);
                }
                else if (['FAILED', 'CANCELLED', 'ABANDONED'].includes(status)) {
                    updatedPayment = await tx.payment.update({
                        where: { reference },
                        data: { status, rawGatewayResponse: verification.raw },
                    });
                    this.logger.warn(`Verification failed for ${reference}. Status: ${status}`);
                    throw new common_1.ForbiddenException(`Payment not successful. Status: ${status}`);
                }
                else {
                    updatedPayment = await tx.payment.update({
                        where: { reference },
                        data: { status: 'PENDING', rawGatewayResponse: verification.raw },
                    });
                    this.logger.warn(`Payment ${reference} is still in transient state: ${status}`);
                    throw new common_1.ForbiddenException(`Payment not yet successful. Status: ${status}`);
                }
                return verification;
            });
        }
        catch (err) {
            this.logger.error(`❌ Verification failed: ${operation}. ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Verification failed due to an unknown server error', err.message);
        }
    }
    async handleWebhook(signature, rawBody, gatewayIdentifier) {
        const operation = `Handle webhook event`;
        try {
            this.logger.log(`Processing: ${operation}`);
            const payload = JSON.parse(rawBody.toString('utf-8'));
            const reference = payload.data?.reference || payload.reference;
            if (!reference) {
                throw new common_1.BadRequestException('Webhook payload missing transaction reference.');
            }
            let sourceGateway;
            if (gatewayIdentifier === 'PAYSTACK' || (this.gateway instanceof paystack_gateway_1.PaystackGateway && this.gateway.getGatewayName() === 'PAYSTACK')) {
                sourceGateway = this.gateway;
                if (!sourceGateway.verifyWebhookSignature(signature, rawBody)) {
                    this.logger.error('❌ Paystack webhook signature verification failed.', { signature });
                    throw new common_1.ForbiddenException('Invalid Paystack webhook signature.');
                }
            }
            else if (gatewayIdentifier === 'FLUTTERWAVE') {
                this.logger.warn('Flutterwave webhook support not fully implemented.');
                throw new common_1.BadRequestException('Unsupported gateway webhook.');
            }
            else {
                this.logger.warn(`Unknown or ambiguous webhook gateway. Attempting with active injected gateway: ${this.gateway.getGatewayName()}`);
                sourceGateway = this.gateway;
            }
            try {
                await this.verifyPayment(reference, sourceGateway);
            }
            catch (e) {
                if (e.status !== 403) {
                    throw e;
                }
                this.logger.log(`Webhook processed for ${reference}, payment status is not SUCCESS (expected: ${e.message}).`);
            }
            this.logger.log(`✅ Webhook successfully processed for ${reference}`);
            return { success: true };
        }
        catch (err) {
            this.logger.error(`❌ Webhook failed: ${operation}. Error: ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException('Webhook processing failed', err.message);
        }
    }
    async capturePayment(reference) {
        const operation = `Capture payment for reference: ${reference}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const payment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!payment)
                throw new common_1.NotFoundException('Payment record not found.');
            if (payment.status !== 'AUTHORIZED') {
                throw new common_1.BadRequestException(`Payment status is ${payment.status}, cannot capture.`);
            }
            const captureResult = await this.gateway.capturePayment(reference);
            if (captureResult.success) {
                await this.prisma.payment.update({
                    where: { reference },
                    data: {
                        status: 'SUCCESS',
                        rawGatewayResponse: captureResult.gatewayResponse,
                        verifiedAt: new Date(),
                    },
                });
                this.logger.log(`✅ ${operation} successful.`);
                await this.triggerPostPaymentActions(this.prisma, payment.id);
            }
            else {
                await this.prisma.payment.update({
                    where: { reference },
                    data: {
                        status: 'CAPTURE_FAILED',
                        rawGatewayResponse: captureResult.gatewayResponse,
                    },
                });
                this.logger.warn(`❌ ${operation} failed: ${captureResult.message || 'Unknown error'}`);
                throw new common_1.InternalServerErrorException(`Failed to capture payment: ${captureResult.message || 'Gateway error'}`);
            }
            return { success: captureResult.success, gatewayData: captureResult.gatewayResponse };
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to capture payment via gateway', err.message);
        }
    }
    async refundPayment(reference, amount) {
        const operation = `Refund payment ${reference} for amount ${amount}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const payment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!payment)
                throw new common_1.NotFoundException('Payment record not found.');
            if (payment.status !== 'SUCCESS' && payment.status !== 'CAPTURED') {
                throw new common_1.BadRequestException(`Payment status is ${payment.status}, cannot be refunded.`);
            }
            const paymentAmount = new decimal_js_1.Decimal(payment.amount);
            const refundAmount = new decimal_js_1.Decimal(amount);
            if (refundAmount.greaterThan(paymentAmount)) {
                throw new common_1.BadRequestException(`Refund amount ${amount} exceeds original payment amount ${payment.amount}.`);
            }
            const refundResult = await this.gateway.refundPayment(reference, refundAmount.mul(100).toNumber());
            if (refundResult.success) {
                await this.prisma.payment.update({
                    where: { reference },
                    data: {
                        status: 'REFUNDED',
                        rawGatewayResponse: refundResult.gatewayResponse,
                    },
                });
                this.logger.log(`✅ ${operation} successful.`);
            }
            else {
                await this.prisma.payment.update({
                    where: { reference },
                    data: {
                        status: 'REFUND_FAILED',
                        rawGatewayResponse: refundResult.gatewayResponse,
                    },
                });
                this.logger.warn(`❌ ${operation} failed: ${refundResult.message || 'Unknown error'}`);
                throw new common_1.InternalServerErrorException(`Failed to refund payment: ${refundResult.message || 'Gateway error'}`);
            }
            return { success: refundResult.success, gatewayData: refundResult.gatewayResponse };
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to refund payment via gateway', err.message);
        }
    }
    async partialRefund(reference, amount) {
        const operation = `Partial refund for payment ${reference} with amount ${amount}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const payment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!payment)
                throw new common_1.NotFoundException('Payment record not found.');
            if (payment.status !== 'SUCCESS' && payment.status !== 'CAPTURED' && payment.status !== 'PARTIALLY_REFUNDED') {
                throw new common_1.BadRequestException(`Payment status is ${payment.status}, cannot perform partial refund.`);
            }
            const paymentAmount = new decimal_js_1.Decimal(payment.amount);
            const refundedAmount = payment.refundedAmount ? new decimal_js_1.Decimal(payment.refundedAmount) : new decimal_js_1.Decimal(0);
            const refundableAmount = paymentAmount.minus(refundedAmount);
            const partialRefundAmount = new decimal_js_1.Decimal(amount);
            if (partialRefundAmount.lessThanOrEqualTo(0) || partialRefundAmount.greaterThan(refundableAmount)) {
                throw new common_1.BadRequestException(`Invalid partial refund amount. Amount must be positive and not exceed ${refundableAmount.toFixed(2)}.`);
            }
            const refundResult = await this.gateway.partialRefund(reference, partialRefundAmount.mul(100).toNumber());
            if (refundResult.success) {
                await this.prisma.payment.update({
                    where: { reference },
                    data: {
                        status: partialRefundAmount.equals(refundableAmount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
                        refundedAmount: new decimal_js_1.Decimal(payment.refundedAmount || 0).plus(partialRefundAmount),
                        rawGatewayResponse: refundResult.gatewayResponse,
                    },
                });
                this.logger.log(`✅ ${operation} successful.`);
            }
            else {
                await this.prisma.payment.update({
                    where: { reference },
                    data: {
                        status: 'REFUND_FAILED',
                        rawGatewayResponse: refundResult.gatewayResponse,
                    },
                });
                this.logger.warn(`❌ ${operation} failed: ${refundResult.message || 'Unknown error'}`);
                throw new common_1.InternalServerErrorException(`Failed to perform partial refund: ${refundResult.message || 'Gateway error'}`);
            }
            return { success: refundResult.success, gatewayData: refundResult.gatewayResponse };
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to perform partial refund via gateway', err.message);
        }
    }
    async triggerPostPaymentActions(tx, paymentId) {
        this.logger.log(`Triggering post-payment actions for payment ID: ${paymentId}`);
        try {
            const payment = await tx.payment.findUniqueOrThrow({
                where: { id: paymentId },
                include: { booking: { include: { mechanic: { include: { subaccount: true } } } } }
            });
            if (!payment.booking) {
                this.logger.error(`Booking not found for payment ${paymentId}. Cannot trigger post-payment actions.`);
                return;
            }
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CONFIRMED' },
            });
            this.logger.log(`Booking ${payment.bookingId} status updated to CONFIRMED.`);
            if (payment.booking.mechanic?.id) {
                const mechanicSubaccount = await tx.subaccount.findUnique({
                    where: { mechanicId: payment.booking.mechanic.id }
                });
                const commissionPercentage = mechanicSubaccount?.percentageCharge || 0;
                const totalPaidAmount = new decimal_js_1.Decimal(payment.amount);
                const mechanicShare = totalPaidAmount.minus(totalPaidAmount.mul(new decimal_js_1.Decimal(commissionPercentage).div(100)));
                this.logger.log(`Mechanic ${payment.booking.mechanic.id} credited with ${mechanicShare.toFixed(2)}.`);
            }
            else {
                this.logger.warn(`No mechanic associated with booking ${payment.bookingId}. Funds not credited to a mechanic wallet.`);
            }
        }
        catch (error) {
            this.logger.error(`Error in post-payment actions for payment ID ${paymentId}: ${error.message}`, error.stack);
        }
    }
    getGatewayName() {
        if (typeof this.gateway.getGatewayName === 'function') {
            return this.gateway.getGatewayName();
        }
        return this.gateway.constructor.name;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IPaymentGateway')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], PaymentService);
//# sourceMappingURL=payment.services.js.map