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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const notification_gateway_1 = require("./notification.gateway");
const sms_strategy_1 = require("./strategy/sms.strategy");
const user_service_1 = require("../user/user.service");
const mail_service_1 = require("../mail/mail.service");
const decimal_js_1 = require("decimal.js");
let NotificationService = NotificationService_1 = class NotificationService {
    gateway;
    mailService;
    smsService;
    userService;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(gateway, mailService, smsService, userService) {
        this.gateway = gateway;
        this.mailService = mailService;
        this.smsService = smsService;
        this.userService = userService;
        this.logger.log(`NotificationService initialized.`);
    }
    generateTemplate(event, payload) {
        let subject = 'Notification from the Mechanic App';
        let htmlBody = `<p>You have a new notification:</p><p><b>${event}</b></p>`;
        let smsBody = `New notification: ${event}`;
        switch (event) {
            case 'paymentSuccess':
                const amountPaid = payload.amount instanceof decimal_js_1.Decimal ? payload.amount.toFixed(2) : payload.amount;
                subject = `Payment Confirmed: ${amountPaid}`;
                htmlBody = `
          <h3>Payment Successful! ✅</h3>
          <p>Hi there,</p>
          <p>Your payment of <b>${amountPaid}</b> for booking <b>#${payload.bookingId || 'N/A'}</b> was confirmed.</p>
          <p>Transaction Reference: <code>${payload.reference}</code></p>
          <p>Thank you for choosing us!</p>
          <p>The Mechanic App Team</p>
        `;
                smsBody = `Payment of ${amountPaid} confirmed for booking #${payload.bookingId || 'N/A'}. Ref: ${payload.reference}.`;
                break;
            case 'paymentFailed':
                subject = `Payment Failed for Booking #${payload.bookingId || 'N/A'}`;
                htmlBody = `
          <h3>Payment Failed ❌</h3>
          <p>Hi there,</p>
          <p>Your payment for booking <b>#${payload.bookingId || 'N/A'}</b> has unfortunately failed.</p>
          <p>Reason: <b>${payload.reason}</b></p>
          <p>Please try again or contact our support team if the issue persists.</p>
          <p>The Mechanic App Team</p>
        `;
                smsBody = `Payment for booking #${payload.bookingId || 'N/A'} failed. Reason: ${payload.reason}. Please retry.`;
                break;
            case 'bookingCompleted':
                subject = `Booking #${payload.bookingId} Completed!`;
                htmlBody = `
          <h3>Booking Completed! 🎉</h3>
          <p>Hi there,</p>
          <p>Your booking <b>#${payload.bookingId}</b> has been successfully completed by your mechanic.</p>
          <p>We hope you had a great experience! Please log in to the app to rate the service and leave a review.</p>
          <p>The Mechanic App Team</p>
        `;
                smsBody = `Booking #${payload.bookingId} completed! Log in to rate your mechanic.`;
                break;
            case 'bookingCancelled':
                subject = `Booking #${payload.bookingId} Cancelled`;
                htmlBody = `
          <h3>Booking Cancelled 🚫</h3>
          <p>Hi there,</p>
          <p>Your booking <b>#${payload.bookingId}</b> has been cancelled.</p>
          <p>Reason: <b>${payload.reason || 'Not specified'}</b></p>
          <p>We apologize for any inconvenience this may cause.</p>
          <p>The Mechanic App Team</p>
        `;
                smsBody = `Booking #${payload.bookingId} cancelled. Reason: ${payload.reason || 'N/A'}.`;
                break;
            case 'disputeResolved':
                subject = `Dispute for Booking #${payload.bookingId || 'N/A'} Resolved`;
                htmlBody = `
          <h3>Dispute Resolved ✅</h3>
          <p>Hi there,</p>
          <p>Your dispute regarding booking <b>#${payload.bookingId || 'N/A'}</b> (ID: <b>${payload.disputeId}</b>) has been resolved.</p>
          <p>Final Status: <b>${payload.status}</b></p>
          <p>Please log in to the app for more details.</p>
          <p>The Mechanic App Team</p>
        `;
                smsBody = `Dispute #${payload.disputeId} for booking #${payload.bookingId || 'N/A'} resolved. Status: ${payload.status}.`;
                break;
        }
        return { subject, htmlBody, smsBody };
    }
    async sendNotification(recipientId, event, payload, useFallback = true) {
        this.logger.verbose(`Dispatching notification '${event}' to user ${recipientId}.`);
        const isOnline = this.gateway.emitToUser(recipientId, event, payload);
        this.logger.debug(`User ${recipientId} real-time status: ${isOnline ? 'Online' : 'Offline'}`);
        if (useFallback && !isOnline) {
            this.logger.log(`User ${recipientId} is offline. Initiating fallback for event '${event}'.`);
            this.handleFallback(recipientId, event, payload)
                .catch(err => this.logger.error(`Failed to send fallback for user ${recipientId}, event ${event}: ${err.message}`, err.stack));
        }
        else if (useFallback && isOnline) {
        }
        return isOnline;
    }
    async emitPaymentSuccess(userId, payment) {
        await this.sendNotification(userId, 'paymentSuccess', { ...payment });
    }
    async emitPaymentFailed(userId, reason, bookingId) {
        await this.sendNotification(userId, 'paymentFailed', { reason, bookingId });
    }
    async emitBookingCompleted(customerId, bookingId) {
        await this.sendNotification(customerId, 'bookingCompleted', { bookingId });
    }
    async emitBookingCancelled(recipientId, bookingId, reason) {
        await this.sendNotification(recipientId, 'bookingCancelled', { bookingId, reason });
    }
    async emitDisputeResolved(userId, disputeId, status, bookingId) {
        await this.sendNotification(userId, 'disputeResolved', { disputeId, status, bookingId });
    }
    async handleFallback(userId, event, payload) {
        try {
            const user = await this.userService.getUserContactDetails(userId);
            if (!user) {
                this.logger.warn(`User ${userId} not found for fallback notification. Skipping.`);
                return;
            }
            const template = this.generateTemplate(event, payload);
            if (user.email) {
                await this.mailService.sendMail(user.email, template.subject, template.smsBody, template.htmlBody);
            }
            else {
                this.logger.warn(`User ${userId} has no email address for fallback email for event '${event}'.`);
            }
            if (user.phoneNumber) {
                await this.smsService.send(user.phoneNumber, template);
            }
            else {
                this.logger.warn(`User ${userId} has no phone number for fallback SMS for event '${event}'.`);
            }
        }
        catch (error) {
            this.logger.error(`Critical error in fallback notification for user ${userId}, event ${event}: ${error.message}`, error.stack);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_gateway_1.NotificationGateway, typeof (_a = typeof mail_service_1.MailService !== "undefined" && mail_service_1.MailService) === "function" ? _a : Object, sms_strategy_1.SmsStrategy, typeof (_b = typeof user_service_1.UserService !== "undefined" && user_service_1.UserService) === "function" ? _b : Object])
], NotificationService);
//# sourceMappingURL=notification.service.js.map