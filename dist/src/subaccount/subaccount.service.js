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
var SubaccountService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubaccountService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const payment_gateway_interface_1 = require("../payment/interface/payment-gateway.interface");
let SubaccountService = SubaccountService_1 = class SubaccountService {
    prisma;
    gateway;
    logger = new common_1.Logger(SubaccountService_1.name);
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.logger.log(`Subaccount service initialized using Gateway: ${this.gateway.constructor.name}`);
    }
    async createMechanicSubaccount(userId, dto) {
        const operation = `Create subaccount for user ${userId}`;
        this.logger.debug(`Starting: ${operation}`);
        try {
            await this.assertMechanicEligibility(userId);
            this.logger.log(`Delegating subaccount creation to gateway for ${dto.businessName}`);
            const gatewayResult = await this.gateway.createSubaccount({
                businessName: dto.businessName,
                bankCode: dto.bankCode,
                accountNumber: dto.accountNumber,
                percentageCharge: dto.percentageCharge,
            });
            if (!gatewayResult || !gatewayResult.subaccountId) {
                this.logger.error(`Gateway returned invalid result: ${JSON.stringify(gatewayResult)}`);
                throw new common_1.BadRequestException('Payment gateway failed to create subaccount. Check bank details or gateway configuration.');
            }
            const subaccount = await this.prisma.subaccount.create({
                data: {
                    userId,
                    gateway: this.gateway.constructor.name,
                    subaccountCode: gatewayResult.subaccountId,
                    bankCode: dto.bankCode,
                    accountNumber: dto.accountNumber,
                    businessName: dto.businessName,
                    percentageCharge: dto.percentageCharge,
                },
            });
            this.logger.log(`✅ Subaccount created and linked (Code: ${subaccount.subaccountCode})`);
            return subaccount;
        }
        catch (err) {
            this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
            if (err instanceof common_1.NotFoundException || err instanceof common_1.ConflictException || err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to create subaccount due to an unexpected server issue.');
        }
    }
    async getSubaccount(userId) {
        const operation = `Get subaccount for user ${userId}`;
        this.logger.debug(`Starting: ${operation}`);
        try {
            const sub = await this.prisma.subaccount.findUnique({ where: { userId } });
            if (!sub) {
                this.logger.warn(`Subaccount not found for user ID: ${userId}`);
                throw new common_1.NotFoundException('Subaccount not found.');
            }
            this.logger.log(`✅ Subaccount retrieved for ${userId}`);
            return sub;
        }
        catch (err) {
            if (!(err instanceof common_1.NotFoundException)) {
                this.logger.error(`❌ Failed: ${operation}`, err.stack);
            }
            throw err;
        }
    }
    async findAll(query) {
        const operation = `Get all subaccounts (Page ${query.page || 1})`;
        this.logger.debug(`Starting: ${operation}`);
        try {
            const page = Math.max(query.page || 1, 1);
            const limit = Math.min(Math.max(query.limit || 20, 1), 200);
            const skip = (page - 1) * limit;
            const [total, data] = await Promise.all([
                this.prisma.subaccount.count({}),
                this.prisma.subaccount.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true }
                        }
                    }
                }),
            ]);
            this.logger.log(`✅ Retrieved ${data.length} subaccounts out of ${total}.`);
            return {
                meta: { total, page, limit, pages: Math.ceil(total / limit) },
                data,
            };
        }
        catch (err) {
            this.logger.error(`❌ Failed: ${operation}. Error: ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException('Could not retrieve subaccounts.');
        }
    }
    async assertMechanicEligibility(userId) {
        const mechanic = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!mechanic) {
            throw new common_1.NotFoundException('Mechanic not found.');
        }
        const existing = await this.prisma.subaccount.findUnique({ where: { userId } });
        if (existing) {
            throw new common_1.ConflictException('Mechanic already has a subaccount.');
        }
    }
};
exports.SubaccountService = SubaccountService;
exports.SubaccountService = SubaccountService = SubaccountService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IPaymentGateway')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof payment_gateway_interface_1.IPaymentGateway !== "undefined" && payment_gateway_interface_1.IPaymentGateway) === "function" ? _a : Object])
], SubaccountService);
//# sourceMappingURL=subaccount.service.js.map