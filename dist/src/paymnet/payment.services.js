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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const axios_1 = require("axios");
const class_transformer_1 = require("class-transformer");
const createPayment_dto_1 = require("./dto/createPayment.dto");
let PaymentService = class PaymentService {
    prisma;
    PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initiatePayment(dto, customerEmail) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: dto.bookingId },
            });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            const reference = `PS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            await this.prisma.payment.create({
                data: {
                    bookingId: dto.bookingId,
                    amount: dto.amount,
                    reference,
                },
            });
            const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
                email: customerEmail,
                amount: dto.amount * 100,
                reference,
            }, {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                },
            });
            return (0, class_transformer_1.plainToInstance)(createPayment_dto_1.PaymentResponseDto, {
                success: true,
                message: 'Payment initiated',
                data: response.data.data,
            });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.response?.data || 'Payment initiation failed');
        }
    }
    async verifyPayment(reference) {
        try {
            const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                },
            });
            const payment = await this.prisma.payment.update({
                where: { reference },
                data: { status: response.data.data.status.toUpperCase() },
            });
            if (payment.status === 'SUCCESS') {
                await this.prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'CONFIRMED' },
                });
            }
            return {
                success: true,
                message: 'Payment verified',
                data: payment,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.response?.data || 'Payment verification failed');
        }
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.services.js.map