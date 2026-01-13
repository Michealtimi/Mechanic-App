import { NotificationGateway } from './notification.gateway';
import { SmsStrategy } from './strategy/sms.strategy';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { Decimal } from 'decimal.js';
export declare class NotificationService {
    private readonly gateway;
    private readonly mailService;
    private readonly smsService;
    private readonly userService;
    private readonly logger;
    constructor(gateway: NotificationGateway, mailService: MailService, smsService: SmsStrategy, userService: UserService);
    private generateTemplate;
    sendNotification(recipientId: string, event: string, payload: any, useFallback?: boolean): Promise<boolean>;
    emitPaymentSuccess(userId: string, payment: {
        reference: string;
        amount: Decimal;
        bookingId?: string;
    }): Promise<void>;
    emitPaymentFailed(userId: string, reason: string, bookingId?: string): Promise<void>;
    emitBookingCompleted(customerId: string, bookingId: string): Promise<void>;
    emitBookingCancelled(recipientId: string, bookingId: string, reason?: string): Promise<void>;
    emitDisputeResolved(userId: string, disputeId: string, status: string, bookingId?: string): Promise<void>;
    private handleFallback;
}
