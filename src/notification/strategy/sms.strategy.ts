import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannelStrategy } from '../abstract/notification.strategy';
import { NotificationTemplate } from '../interface/notification-template.interface';
// import { Twilio } from 'twilio'; // Example: if using Twilio

@Injectable()
export class SmsStrategy implements NotificationChannelStrategy {
  private readonly logger = new Logger(SmsStrategy.name);
  // private twilioClient: Twilio; // Example for Twilio

  constructor() {
    // this.twilioClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async send(to: string, template: NotificationTemplate): Promise<void> {
    this.logger.log(`[SMS] Sending to ${to}: ${template.smsBody}`);
    // In a real app, integrate with your SMS provider (e.g., Twilio, Africa's Talking)
    // await this.twilioClient.messages.create({
    //   body: template.smsBody,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: to, // Ensure 'to' is a valid phone number format
    // });
    return Promise.resolve(); // Mock success
  }

  getType(): 'SMS' { return 'SMS'; }
}