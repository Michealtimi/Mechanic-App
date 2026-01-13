import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { SmsStrategy } from './strategy/sms.strategy';
import { UserService } from '../user/user.service'; // Adjust path if necessary
import { MailService } from '../mail/mail.service'; // ⬅️ NEW: Your MailService
import { NotificationTemplate } from './interface/notification-template.interface';
import { Decimal } from 'decimal.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly gateway: NotificationGateway,
    private readonly mailService: MailService, // ⬅️ Injected your MailService
    private readonly smsService: SmsStrategy,
    private readonly userService: UserService,
  ) {
    this.logger.log(`NotificationService initialized.`);
  }

  /**
   * Generates a template for email/SMS based on the event and payload.
   * This method centralizes content generation.
   */
  private generateTemplate(event: string, payload: any): NotificationTemplate {
    let subject = 'Notification from the Mechanic App';
    let htmlBody = `<p>You have a new notification:</p><p><b>${event}</b></p>`;
    let smsBody = `New notification: ${event}`;

    switch (event) {
      case 'paymentSuccess':
        const amountPaid = payload.amount instanceof Decimal ? payload.amount.toFixed(2) : payload.amount;
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

      // Add more cases for other events like 'mechanicAssigned', 'newBookingForMechanic', etc.
    }

    return { subject, htmlBody, smsBody };
  }

  /**
   * Main dispatch method: Sends real-time notification, then handles email/SMS fallback.
   */
  async sendNotification(
    recipientId: string,
    event: string,
    payload: any,
    useFallback: boolean = true,
  ) {
    this.logger.verbose(`Dispatching notification '${event}' to user ${recipientId}.`);

    // 1. Real-time delivery (e.g., via WebSockets)
    const isOnline = this.gateway.emitToUser(recipientId, event, payload);
    this.logger.debug(`User ${recipientId} real-time status: ${isOnline ? 'Online' : 'Offline'}`);

    // 2. Fallback mechanism (Email/SMS if user is offline or forced)
    if (useFallback && !isOnline) {
      this.logger.log(`User ${recipientId} is offline. Initiating fallback for event '${event}'.`);
      // Don't await the fallback, let it run in the background.
      // This prevents the main request from being blocked by email/SMS sending.
      this.handleFallback(recipientId, event, payload)
        .catch(err => this.logger.error(`Failed to send fallback for user ${recipientId}, event ${event}: ${err.message}`, err.stack));
    } else if (useFallback && isOnline) {
        // Option: Send fallback anyway, even if online (e.g., important emails for audit)
        // this.logger.debug(`User ${recipientId} is online, but fallback is enabled. Sending non-blocking fallback.`);
        // this.handleFallback(recipientId, event, payload)
        //   .catch(err => this.logger.error(`Failed to send non-blocking fallback for online user ${recipientId}: ${err.message}`, err.stack));
    }

    return isOnline; // Returns true if real-time was sent
  }

  // -------------------------------------------------------------------
  // Public Business-Specific Notification Methods (Used by other services)
  // -------------------------------------------------------------------

  async emitPaymentSuccess(userId: string, payment: { reference: string; amount: Decimal; bookingId?: string }) {
    await this.sendNotification(
      userId,
      'paymentSuccess',
      { ...payment } // Pass full payment object to template
    );
  }

  async emitPaymentFailed(userId: string, reason: string, bookingId?: string) {
    await this.sendNotification(
      userId,
      'paymentFailed',
      { reason, bookingId } // Pass reason and bookingId to template
    );
  }

  async emitBookingCompleted(customerId: string, bookingId: string) {
    await this.sendNotification(
      customerId,
      'bookingCompleted',
      { bookingId }
    );
  }

  async emitBookingCancelled(recipientId: string, bookingId: string, reason?: string) { // Recipient can be customer or mechanic
    await this.sendNotification(
      recipientId,
      'bookingCancelled',
      { bookingId, reason }
    );
  }

  async emitDisputeResolved(userId: string, disputeId: string, status: string, bookingId?: string) {
    await this.sendNotification(
      userId,
      'disputeResolved',
      { disputeId, status, bookingId }
    );
  }

  // -------------------------------------------------------------------
  // Private Fallback Handling Logic
  // -------------------------------------------------------------------
  private async handleFallback(userId: string, event: string, payload: any): Promise<void> {
    try {
      const user = await this.userService.getUserContactDetails(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found for fallback notification. Skipping.`);
        return;
      }

      const template = this.generateTemplate(event, payload);

      // Send email using your MailService
      if (user.email) {
        await this.mailService.sendMail(user.email, template.subject, template.smsBody, template.htmlBody);
      } else {
        this.logger.warn(`User ${userId} has no email address for fallback email for event '${event}'.`);
      }

      // Send SMS using your SmsStrategy
      if (user.phoneNumber) {
        await this.smsService.send(user.phoneNumber, template);
      } else {
        this.logger.warn(`User ${userId} has no phone number for fallback SMS for event '${event}'.`);
      }

      // Potentially add push notification logic here
      // if (user.pushToken) { /* send push notification */ }

    } catch (error) {
      this.logger.error(`Critical error in fallback notification for user ${userId}, event ${event}: ${error.message}`, error.stack);
      // Consider integrating with an error tracking service here (e.g., Sentry, Bugsnag)
    }
  }
}