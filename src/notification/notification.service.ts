// src/modules/notifications/notification.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

// --- MOCK PLACEHOLDERS for external services ---
// In a real app, these would be injected services (EmailService, SmsService)
class MockEmailService { 
    send(to: string, subject: string, body: string) { 
        console.log(`[EMAIL MOCK] Sending to ${to}: ${subject}`); 
    }
}
class MockSmsService {
    send(to: string, message: string) { 
        console.log(`[SMS MOCK] Sending to ${to}: ${message}`); 
    }
}


@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    // ⚠️ CRITICAL: Inject all services needed for fallback and user lookup
    // Assuming you have a UserService to find user contact details.
    
    constructor(
        private readonly gateway: NotificationGateway,
        private readonly emailService: MockEmailService = new MockEmailService(), // Mock
        private readonly smsService: MockSmsService = new MockSmsService(),       // Mock
        // private readonly userService: UserService, // Would be injected here
    ) {}

    /**
     * Sends a real-time notification to a specific user, with email/SMS fallback.
     * This method acts as the central dispatcher for all application notifications.
     */
    async sendNotification(
        recipientId: string, 
        event: string, 
        payload: any, 
        useFallback: boolean = true
    ) {
        // 1. LOG THE EVENT (Audit Trail)
        this.logger.verbose(`Dispatching notification '${event}' to user ${recipientId}.`);

        // 2. REAL-TIME DELIVERY (Primary method)
        const isOnline = this.gateway.emitToUser(recipientId, event, payload);
        
        // 3. FALLBACK MECHANISM (If user is offline or fallback is enabled)
        if (useFallback && !isOnline) {
            // In a real app, fetch user contact details here: 
            // const user = await this.userService.findById(recipientId);
            
            // For example, if the user is offline, send an email:
            this.handleFallback(recipientId, event, payload); 
        }

        return isOnline;
    }
    
    // -------------------------------------------------------------------
    // STANDARDIZED BUSINESS METHODS (Called by BookingService, etc.)
    // -------------------------------------------------------------------

    async sendBookingCompleted(userId: string, bookingId: string) {
        await this.sendNotification(
            userId, 
            'bookingCompleted', 
            { bookingId, message: 'Your booking is complete!' }
        );
    }
    
    async sendPaymentConfirmed(userId: string, amount: number) {
        // Note: Renamed from sendConfirmation for better clarity on the event
        await this.sendNotification(
            userId, 
            'paymentConfirmed', 
            { amount, message: `Your payment of ${amount} was confirmed.` }
        );
    }

    async sendDisputeResolved(userId: string, disputeId: string, status: string) {
        await this.sendNotification(
            userId, 
            'disputeResolved', 
            { disputeId, status, message: `Your dispute was resolved with status: ${status}.` }
        );
    }

    // -------------------------------------------------------------------
    // PRIVATE FALLBACK HANDLER
    // -------------------------------------------------------------------
    private handleFallback(userId: string, event: string, payload: any) {
        // ⚠️ Logic to map events to a user-friendly email/SMS template
        
        switch (event) {
            case 'paymentConfirmed':
                this.emailService.send(
                    `${userId}@example.com`, 
                    'Payment Confirmed ✅', 
                    `Your payment of ${payload.amount} was successful.`
                );
                break;
            case 'bookingCompleted':
                this.smsService.send(
                    '23480...', 
                    `Booking ${payload.bookingId} is complete! Log in to rate the service.`
                );
                break;
            default:
                this.logger.warn(`No fallback defined for event: ${event}`);
        }
    }
}