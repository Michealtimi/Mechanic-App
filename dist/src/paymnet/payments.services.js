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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const wallet_service_1 = require("../wallet/wallet.service");
const crypto_1 = require("crypto");
const notification_gateway_1 = require("../notification/notification.gateway");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    gateway;
    configService;
    walletService;
    notificationGateway;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, gateway, configService, walletService, notificationGateway) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.configService = configService;
        this.walletService = walletService;
        this.notificationGateway = notificationGateway;
        this.logger.log(`Active Payment Gateway: ${this.gateway.constructor.name}`);
    }
    async initialize(dto) {
        const operation = `Initialize payment for booking ${dto.bookingId}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: dto.bookingId },
                include: { customer: true },
            });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            if (booking.status !== client_1.BookingStatus.PENDING) {
                throw new common_1.BadRequestException(`Booking ${dto.bookingId} is not in PENDING status. Current: ${booking.status}`);
            }
            if (!booking.customer?.email) {
                throw new common_1.InternalServerErrorException('Customer email missing for payment initiation.');
            }
            if (booking.price !== dto.amount) {
                this.logger.error(`Amount mismatch: Booking price ${booking.price}, Requested ${dto.amount}`);
                throw new common_1.BadRequestException('Requested payment amount does not match booking price.');
            }
            const reference = `BK-${Date.now()}-${dto.bookingId}`;
            const amountInSmallestUnit = Number(dto.amount);
            const gatewayResponse = await this.gateway.initializePayment({
                amount: amountInSmallestUnit,
                email: booking.customer.email,
                metadata: { ...dto.metadata, reference },
                subaccountCode: dto.mechanicSubaccount || undefined,
            });
            await this.prisma.payment.create({
                data: {
                    bookingId: dto.bookingId,
                    userId: booking.customerId,
                    reference: gatewayResponse.reference,
                    amount: dto.amount,
                    status: 'PENDING',
                    gateway: dto.gateway,
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
    async verifyPayment(reference, gatewayIdentifier) {
        const operation = `Verify payment ${reference}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const existingPayment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!existingPayment)
                throw new common_1.NotFoundException('Payment record not found');
            if (existingPayment.status === client_1.PaymentStatus.SUCCESS || existingPayment.status === client_1.PaymentStatus.CAPTURED) {
                this.logger.warn(`Verification called for already successful payment: ${reference}. Returning existing status.`);
                return { status: existingPayment.status, amount: existingPayment.amount, message: 'Payment already successfully verified.', raw: existingPayment.rawGatewayResponse };
            }
            const activeGateway = this.gateway;
            if (gatewayIdentifier && existingPayment.gateway !== gatewayIdentifier) {
                this.logger.warn(`Gateway mismatch for verification. Stored: ${existingPayment.gateway}, Verification attempt: ${gatewayIdentifier}.`);
            }
            const verification = await activeGateway.verifyPayment(reference);
            return await this.prisma.$transaction(async (tx) => {
                const status = verification.status.toUpperCase();
                const verifiedAmount = BigInt(verification.amount);
                let updatedPayment;
                if (status === client_1.PaymentStatus.SUCCESS || status === client_1.PaymentStatus.CAPTURED) {
                    if (verifiedAmount !== existingPayment.amount) {
                        this.logger.error(`Amount mismatch for ${reference}. Expected: ${existingPayment.amount}, Received: ${verifiedAmount}`);
                        throw new common_1.BadRequestException('Amount mismatch during verification. Possible fraud.');
                    }
                    updatedPayment = await tx.payment.update({
                        where: { id: existingPayment.id },
                        data: {
                            status,
                            verifiedAt: new Date(),
                            rawGatewayResponse: verification.raw,
                            amount: verifiedAmount,
                        },
                    });
                    this.logger.log(`✅ Payment ${reference} verified successfully. Status: ${status}`);
                    await this.triggerPostPaymentActions(tx, updatedPayment.id);
                }
                else if (['FAILED', 'CANCELLED', 'ABANDONED'].includes(status)) {
                    updatedPayment = await tx.payment.update({
                        where: { id: existingPayment.id },
                        data: { status, rawGatewayResponse: verification.raw },
                    });
                    this.logger.warn(`Verification failed for ${reference}. Status: ${status}`);
                    throw new common_1.BadRequestException(`Payment not successful. Status: ${status}`);
                }
                else {
                    updatedPayment = await tx.payment.update({
                        where: { id: existingPayment.id },
                        data: { status: client_1.PaymentStatus.PENDING, rawGatewayResponse: verification.raw },
                    });
                    this.logger.warn(`Payment ${reference} is still in transient state: ${status}`);
                    throw new common_1.BadRequestException(`Payment not yet successful. Status: ${status}`);
                }
                return { status: updatedPayment.status, amount: updatedPayment.amount, raw: updatedPayment.rawGatewayResponse };
            });
        }
        catch (err) {
            this.logger.error(`❌ Verification failed: ${operation}. ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.ForbiddenException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Verification failed due to an unknown server error', err.message);
        }
    }
    async handleWebhook(signature, rawBody) {
        const operation = `Handle Paystack webhook event`;
        this.logger.log(`Processing: ${operation}`);
        try {
            const payload = JSON.parse(rawBody.toString('utf8'));
            const event = payload.event;
            const eventData = payload.data;
            const reference = eventData?.reference;
            if (!reference) {
                this.logger.error('Webhook payload missing transaction reference.');
                throw new common_1.BadRequestException('Webhook payload missing transaction reference.');
            }
            const secret = this.configService.get('PAYSTACK_WEBHOOK_SECRET');
            if (!secret) {
                this.logger.error('[Webhook] Paystack webhook secret not configured!');
                throw new common_1.InternalServerErrorException('Webhook secret not configured.');
            }
            const hash = (0, crypto_1.createHmac)('sha512', secret).update(rawBody).digest('hex');
            if (hash !== signature) {
                this.logger.warn(`[Webhook] Invalid Paystack signature for event ${event}.`);
                throw new common_1.ForbiddenException('Invalid webhook signature');
            }
            if (event === 'charge.success' || event === 'transaction.success') {
                this.logger.log(`[Webhook] Paystack: Processing successful transaction ${reference}.`);
                try {
                    await this.verifyPayment(reference, 'PAYSTACK');
                }
                catch (e) {
                    if (e instanceof common_1.BadRequestException) {
                        this.logger.warn(`[Webhook] Payment ${reference} verification resulted in non-success: ${e.message}`);
                    }
                    else {
                        throw e;
                    }
                }
            }
            else {
                this.logger.log(`[Webhook] Unhandled Paystack event type: ${event}.`);
            }
            this.logger.log(`✅ Webhook successfully processed for ${reference}`);
        }
        catch (err) {
            this.logger.error(`❌ Webhook failed: ${operation}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException || err instanceof common_1.InternalServerErrorException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Webhook processing failed due to an unexpected error', err.message);
        }
    }
    async handleFlutterwaveWebhook(signature, rawBody) {
        const operation = `Handle Flutterwave webhook event`;
        this.logger.log(`Processing: ${operation}`);
        try {
            const payload = JSON.parse(rawBody.toString('utf8'));
            const event = payload.event;
            const eventData = payload.data;
            const reference = eventData?.tx_ref;
            if (!reference) {
                this.logger.error('Flutterwave webhook payload missing transaction reference (tx_ref).');
                throw new common_1.BadRequestException('Flutterwave webhook payload missing transaction reference.');
            }
            const secret = this.configService.get('FLUTTERWAVE_WEBHOOK_SECRET');
            if (!secret) {
                this.logger.error('[Webhook] Flutterwave webhook secret not configured!');
                throw new common_1.InternalServerErrorException('Webhook secret not configured.');
            }
            if (signature !== secret) {
                this.logger.warn(`[Webhook] Invalid Flutterwave signature for event ${event}.`);
                throw new common_1.ForbiddenException('Invalid webhook signature');
            }
            if (event === 'charge.completed' && eventData.status === 'successful') {
                this.logger.log(`[Webhook] Flutterwave: Processing successful transaction ${reference}.`);
                try {
                    await this.verifyPayment(reference, 'FLUTTERWAVE');
                }
                catch (e) {
                    if (e instanceof common_1.BadRequestException) {
                        this.logger.warn(`[Webhook] Payment ${reference} verification resulted in non-success: ${e.message}`);
                    }
                    else {
                        throw e;
                    }
                }
            }
            else {
                this.logger.log(`[Webhook] Unhandled Flutterwave event type or status: ${event}/${eventData?.status}.`);
            }
            this.logger.log(`✅ Flutterwave webhook successfully processed for ${reference}`);
        }
        catch (err) {
            this.logger.error(`❌ Flutterwave webhook failed: ${operation}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException || err instanceof common_1.InternalServerErrorException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Flutterwave webhook processing failed due to an unexpected error', err.message);
        }
    }
    async capture(reference) {
        const operation = `Capture payment for reference: ${reference}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const payment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!payment)
                throw new common_1.NotFoundException('Payment record not found.');
            if (payment.status !== client_1.PaymentStatus.AUTHORIZED && payment.status !== client_1.PaymentStatus.PENDING) {
                throw new common_1.BadRequestException(`Payment status is ${payment.status}, cannot capture.`);
            }
            const captureResult = await this.gateway.capturePayment(reference);
            if (captureResult.success) {
                await this.prisma.$transaction(async (tx) => {
                    const updatedPayment = await tx.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: client_1.PaymentStatus.CAPTURED,
                            rawGatewayResponse: captureResult.gatewayResponse,
                            verifiedAt: new Date(),
                        },
                    });
                    this.logger.log(`✅ ${operation} successful. Payment status: CAPTURED.`);
                    await this.triggerPostPaymentActions(tx, updatedPayment.id);
                });
            }
            else {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: client_1.PaymentStatus.CAPTURE_FAILED,
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
    async refund(reference, amount) {
        const operation = `Refund payment ${reference} for amount ${amount}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const payment = await this.prisma.payment.findUnique({ where: { reference } });
            if (!payment)
                throw new common_1.NotFoundException('Payment record not found.');
            if (payment.status !== client_1.PaymentStatus.SUCCESS && payment.status !== client_1.PaymentStatus.CAPTURED && payment.status !== client_1.PaymentStatus.PARTIALLY_REFUNDED) {
                throw new common_1.BadRequestException(`Payment status is ${payment.status}, cannot be refunded.`);
            }
            const paymentAmount = payment.amount;
            const refundedAmount = payment.refundedAmount || 0n;
            const refundableAmount = paymentAmount - refundedAmount;
            if (amount <= 0n || amount > refundableAmount) {
                throw new common_1.BadRequestException(`Invalid refund amount. Amount must be positive and not exceed ${refundableAmount}.`);
            }
            const refundResult = await this.gateway.refundPayment(reference, Number(amount));
            if (refundResult.success) {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: client_1.PaymentStatus.REFUNDED,
                        refundedAmount: paymentAmount,
                        rawGatewayResponse: refundResult.gatewayResponse,
                    },
                });
                this.logger.log(`✅ ${operation} successful.`);
            }
            else {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: client_1.PaymentStatus.REFUND_FAILED,
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
            if (payment.status !== client_1.PaymentStatus.SUCCESS && payment.status !== client_1.PaymentStatus.CAPTURED && payment.status !== client_1.PaymentStatus.PARTIALLY_REFUNDED) {
                throw new common_1.BadRequestException(`Payment status is ${payment.status}, cannot perform partial refund.`);
            }
            const paymentAmount = payment.amount;
            const alreadyRefundedAmount = payment.refundedAmount || 0n;
            const refundableAmount = paymentAmount - alreadyRefundedAmount;
            if (amount <= 0n || amount > refundableAmount) {
                throw new common_1.BadRequestException(`Invalid partial refund amount. Amount must be positive and not exceed ${refundableAmount}.`);
            }
            const refundResult = await this.gateway.partialRefund(reference, Number(amount));
            if (refundResult.success) {
                const newRefundedAmount = alreadyRefundedAmount + amount;
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: newRefundedAmount === paymentAmount ? client_1.PaymentStatus.REFUNDED : client_1.PaymentStatus.PARTIALLY_REFUNDED,
                        refundedAmount: newRefundedAmount,
                        rawGatewayResponse: refundResult.gatewayResponse,
                    },
                });
                this.logger.log(`✅ ${operation} successful.`);
            }
            else {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: client_1.PaymentStatus.REFUND_FAILED,
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
    async initiatePayoutTransfer(mechanicId, amount, bankAccountNumber, bankCode, payoutId) {
        const operation = `Initiate payout transfer for mechanic ${mechanicId} to bank ${bankAccountNumber}`;
        this.logger.log(`Starting: ${operation}`);
        try {
            const mechanic = await this.prisma.mechanic.findUnique({
                where: { id: mechanicId },
                include: { user: true },
            });
            if (!mechanic)
                throw new common_1.NotFoundException('Mechanic not found for payout.');
            if (!mechanic.user?.email)
                throw new common_1.InternalServerErrorException('Mechanic email missing for payout transfer.');
            const amountInSmallestUnit = Number(amount);
            if (amountInSmallestUnit === 0) {
                throw new common_1.BadRequestException('Payout amount must be greater than zero.');
            }
            const gatewayResponse = await this.gateway.initiateTransfer({
                amount: amountInSmallestUnit,
                bankAccountNumber,
                bankCode,
                recipientName: `${mechanic.user.firstName} ${mechanic.user.lastName}`,
                internalReference: `PAYOUT-${payoutId}`,
                email: mechanic.user.email,
            });
            if (gatewayResponse.success) {
                this.logger.log(`✅ ${operation} successful. Gateway Ref: ${gatewayResponse.providerRef}`);
                return {
                    success: true,
                    providerRef: gatewayResponse.providerRef,
                    rawGatewayResponse: gatewayResponse.raw,
                    message: 'Transfer initiated successfully.',
                };
            }
            else {
                this.logger.error(`❌ ${operation} failed: ${gatewayResponse.message}`);
                return {
                    success: false,
                    providerRef: gatewayResponse.providerRef,
                    rawGatewayResponse: gatewayResponse.raw,
                    message: gatewayResponse.message || 'Gateway transfer failed.',
                };
            }
        }
        catch (err) {
            this.logger.error(`❌ ${operation} failed. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.BadRequestException || err instanceof common_1.InternalServerErrorException) {
                throw err;
            }
            return { success: false, message: 'Failed to initiate transfer via gateway.' };
        }
    }
    async triggerPostPaymentActions(tx, paymentId) {
        this.logger.log(`Triggering post-payment actions for payment ID: ${paymentId}`);
        try {
            const payment = await tx.payment.findUniqueOrThrow({
                where: { id: paymentId },
                include: { booking: { include: { mechanic: true } } },
            });
            if (!payment.booking) {
                this.logger.error(`Booking not found for payment ${paymentId}. Cannot trigger post-payment actions.`);
                return;
            }
            if (payment.booking.status !== client_1.BookingStatus.CONFIRMED && payment.booking.status !== client_1.BookingStatus.COMPLETED) {
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        status: client_1.BookingStatus.CONFIRMED,
                        paymentStatus: client_1.PaymentStatus.CAPTURED,
                    },
                });
                this.logger.log(`Booking ${payment.bookingId} status updated to CONFIRMED.`);
                await this.notificationGateway.emitBookingConfirmed(payment.booking.customerId, payment.booking.id);
                this.logger.debug(`Customer ${payment.booking.customerId} notified of booking ${payment.booking.id} confirmation.`);
            }
            if (payment.booking.mechanicId) {
                await this.walletService.creditMechanicWithTx(tx, payment.booking.mechanicId, payment.amount, payment.bookingId);
                this.logger.log(`Mechanic ${payment.booking.mechanicId} pending wallet credited with ${payment.amount}.`);
            }
            else {
                this.logger.warn(`No mechanic associated with booking ${payment.bookingId}. Funds not credited to a mechanic wallet.`);
            }
        }
        catch (error) {
            this.logger.error(`Error in post-payment actions for payment ID ${paymentId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`Failed to complete post-payment actions: ${error.message}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IPaymentGateway')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, config_1.ConfigService,
        wallet_service_1.WalletService,
        notification_gateway_1.NotificationGateway])
], PaymentsService);
//# sourceMappingURL=payments.services.js.map