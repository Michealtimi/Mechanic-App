import { NotificationGateway } from './notification.gateway';
declare class MockEmailService {
    send(to: string, subject: string, body: string): void;
}
declare class MockSmsService {
    send(to: string, message: string): void;
}
export declare class NotificationService {
    private readonly gateway;
    private readonly emailService;
    private readonly smsService;
    private readonly logger;
    constructor(gateway: NotificationGateway, emailService?: MockEmailService, smsService?: MockSmsService);
    sendNotification(recipientId: string, event: string, payload: any, useFallback?: boolean): Promise<boolean>;
    sendBookingCompleted(userId: string, bookingId: string): Promise<void>;
    sendPaymentConfirmed(userId: string, amount: number): Promise<void>;
    sendDisputeResolved(userId: string, disputeId: string, status: string): Promise<void>;
    private handleFallback;
}
export {};
