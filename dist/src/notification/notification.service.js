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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const notification_gateway_1 = require("./notification.gateway");
class MockEmailService {
    send(to, subject, body) {
        console.log(`[EMAIL MOCK] Sending to ${to}: ${subject}`);
    }
}
class MockSmsService {
    send(to, message) {
        console.log(`[SMS MOCK] Sending to ${to}: ${message}`);
    }
}
let NotificationService = NotificationService_1 = class NotificationService {
    gateway;
    emailService;
    smsService;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(gateway, emailService = new MockEmailService(), smsService = new MockSmsService()) {
        this.gateway = gateway;
        this.emailService = emailService;
        this.smsService = smsService;
    }
    async sendNotification(recipientId, event, payload, useFallback = true) {
        this.logger.verbose(`Dispatching notification '${event}' to user ${recipientId}.`);
        const isOnline = this.gateway.emitToUser(recipientId, event, payload);
        if (useFallback && !isOnline) {
            this.handleFallback(recipientId, event, payload);
        }
        return isOnline;
    }
    async sendBookingCompleted(userId, bookingId) {
        await this.sendNotification(userId, 'bookingCompleted', { bookingId, message: 'Your booking is complete!' });
    }
    async sendPaymentConfirmed(userId, amount) {
        await this.sendNotification(userId, 'paymentConfirmed', { amount, message: `Your payment of ${amount} was confirmed.` });
    }
    async sendDisputeResolved(userId, disputeId, status) {
        await this.sendNotification(userId, 'disputeResolved', { disputeId, status, message: `Your dispute was resolved with status: ${status}.` });
    }
    handleFallback(userId, event, payload) {
        switch (event) {
            case 'paymentConfirmed':
                this.emailService.send(`${userId}@example.com`, 'Payment Confirmed ✅', `Your payment of ${payload.amount} was successful.`);
                break;
            case 'bookingCompleted':
                this.smsService.send('23480...', `Booking ${payload.bookingId} is complete! Log in to rate the service.`);
                break;
            default:
                this.logger.warn(`No fallback defined for event: ${event}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_gateway_1.NotificationGateway,
        MockEmailService,
        MockSmsService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map