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
var PaymentReconcileService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReconcileService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const payments_service_1 = require("src/modules/payment/payments.service");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
let PaymentReconcileService = PaymentReconcileService_1 = class PaymentReconcileService {
    prisma;
    paymentsService;
    configService;
    logger = new common_1.Logger(PaymentReconcileService_1.name);
    reconcileBatchSize;
    constructor(prisma, paymentsService, configService) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
        this.configService = configService;
    }
    onModuleInit() {
        this.reconcileBatchSize = this.configService.get('PAYMENT_RECONCILE_BATCH_SIZE', 200);
        this.logger.log(`Payment reconciliation batch size: ${this.reconcileBatchSize}.`);
    }
    async handleReconciliationCron() {
        this.logger.log('Starting cron job: Payment Reconciliation.');
        await this.reconcileStuckPayments();
        this.logger.log('Finished cron job: Payment Reconciliation.');
    }
    async reconcileStuckPayments() {
        this.logger.log('Running reconcileStuckPayments task...');
        try {
            const cutoffDate = new Date(Date.now() - (this.configService.get('PAYMENT_RECONCILE_AGE_MINUTES', 30) * 60 * 1000));
            const paymentsToReconcile = await this.prisma.payment.findMany({
                where: {
                    status: {
                        in: [
                            client_1.PaymentStatus.INITIATED,
                            client_1.PaymentStatus.PENDING,
                            client_1.PaymentStatus.AUTHORIZED,
                        ],
                    },
                    createdAt: { lt: cutoffDate }
                },
                take: this.reconcileBatchSize,
                orderBy: { createdAt: 'asc' },
                include: { booking: true }
            });
            if (paymentsToReconcile.length === 0) {
                this.logger.log('No stuck payments found to reconcile.');
                return;
            }
            this.logger.log(`Found ${paymentsToReconcile.length} stuck payments for reconciliation.`);
            for (const payment of paymentsToReconcile) {
                const operation = `Reconciliation for payment ${payment.id} (Ref: ${payment.reference})`;
                this.logger.log(`Attempting: ${operation}`);
                try {
                    const verificationResult = await this.paymentsService.verifyPayment(payment.reference);
                    this.logger.log(`✅ ${operation} completed. Gateway status: ${verificationResult.status}. ` +
                        `Amount: ${verificationResult.amount}.`);
                }
                catch (err) {
                    this.logger.error(`❌ ${operation} failed: ${err.message}`, err.stack);
                }
            }
            this.logger.log('Finished reconcileStuckPayments task.');
        }
        catch (error) {
            this.logger.error(`Error during reconcileStuckPayments cron job: ${error.message}`, error.stack);
        }
    }
};
exports.PaymentReconcileService = PaymentReconcileService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentReconcileService.prototype, "handleReconciliationCron", null);
exports.PaymentReconcileService = PaymentReconcileService = PaymentReconcileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object, config_1.ConfigService])
], PaymentReconcileService);
//# sourceMappingURL=payment-reconcile.service.js.map