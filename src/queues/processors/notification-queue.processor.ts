import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { MailService } from 'src/utils/mail.service';
import { SmsStrategy } from 'src/notification/strategy/sms.strategy';
import { NotificationGateway } from 'src/notification/notification.gateway';

export interface NotificationJobData {
  recipientId: string;
  event: string;
  payload: any;
  channels: ('email' | 'sms' | 'push')[];
  priority?: 'low' | 'normal' | 'high';
}

@Processor('notification', {
  concurrency: 10,
  limiter: {
    max: 50,
    duration: 1000,
  },
})
@Injectable()
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly smsService: SmsStrategy,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<any> {
    this.logger.log(`[NotificationQueue] Processing job ${job.id} for user ${job.data.recipientId}, event: ${job.data.event}`);

    try {
      const results = {
        email: null as any,
        sms: null as any,
        push: null as any,
      };

      // Send via requested channels
      for (const channel of job.data.channels || ['email', 'sms', 'push']) {
        try {
          switch (channel) {
            case 'email':
              results.email = await this.sendEmail(job.data, job.attemptsMade);
              break;
            case 'sms':
              results.sms = await this.sendSMS(job.data, job.attemptsMade);
              break;
            case 'push':
              results.push = await this.sendPush(job.data, job.attemptsMade);
              break;
          }
        } catch (channelError: any) {
          this.logger.error(`[NotificationQueue] Failed to send ${channel} for job ${job.id}: ${channelError.message}`);
          // Continue with other channels even if one fails
          results[channel] = { success: false, error: channelError.message };
        }
      }

      // Check if at least one channel succeeded
      const hasSuccess = Object.values(results).some(r => r?.success !== false);
      if (!hasSuccess && job.attemptsMade < this.MAX_RETRIES) {
        throw new Error('All notification channels failed');
      }

      return {
        success: hasSuccess,
        recipientId: job.data.recipientId,
        event: job.data.event,
        results,
      };
    } catch (error: any) {
      this.logger.error(`[NotificationQueue] Notification job ${job.id} failed: ${error.message}`, error.stack);
      
      // Retry logic
      if (job.attemptsMade < this.MAX_RETRIES) {
        this.logger.log(`[NotificationQueue] Retrying job ${job.id} (attempt ${job.attemptsMade + 1}/${this.MAX_RETRIES})`);
        throw error; // Re-throw to trigger retry
      }
      
      // Mark as failed after max retries
      this.logger.error(`[NotificationQueue] Job ${job.id} failed after ${this.MAX_RETRIES} attempts`);
      throw error;
    }
  }

  /**
   * SEND EMAIL: Send email notification via MailService
   */
  private async sendEmail(data: NotificationJobData, attempts: number): Promise<any> {
    const operation = 'sendEmail';
    this.logger.log(`[${operation}] Sending email to user ${data.recipientId} for event ${data.event}`);

    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: data.recipientId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!user || !user.email) {
        this.logger.warn(`[${operation}] User ${data.recipientId} has no email address`);
        return { success: false, error: 'No email address' };
      }

      // Generate template using NotificationService
      const template = (this.notificationService as any).generateTemplate?.(data.event, data.payload) || {
        subject: `Notification: ${data.event}`,
        htmlBody: `<p>${JSON.stringify(data.payload)}</p>`,
        smsBody: `Notification: ${data.event}`,
      };

      // Send email
      await this.mailService.sendMail(
        user.email,
        template.subject,
        template.smsBody, // Use SMS body as plain text
        template.htmlBody,
      );

      this.logger.log(`[${operation}] Email sent successfully to ${user.email}`);
      return { success: true, channel: 'email', recipient: user.email };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * SEND SMS: Send SMS notification via SmsStrategy
   */
  private async sendSMS(data: NotificationJobData, attempts: number): Promise<any> {
    const operation = 'sendSMS';
    this.logger.log(`[${operation}] Sending SMS to user ${data.recipientId} for event ${data.event}`);

    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: data.recipientId },
        select: { phoneNumber: true, firstName: true, lastName: true },
      });

      if (!user || !user.phoneNumber) {
        this.logger.warn(`[${operation}] User ${data.recipientId} has no phone number`);
        return { success: false, error: 'No phone number' };
      }

      // Generate template
      const template = (this.notificationService as any).generateTemplate?.(data.event, data.payload) || {
        subject: `Notification: ${data.event}`,
        htmlBody: `<p>${JSON.stringify(data.payload)}</p>`,
        smsBody: `Notification: ${data.event}`,
      };

      // Send SMS
      await this.smsService.send(user.phoneNumber, template);

      this.logger.log(`[${operation}] SMS sent successfully to ${user.phoneNumber}`);
      return { success: true, channel: 'sms', recipient: user.phoneNumber };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * SEND PUSH: Send push notification via NotificationGateway (Socket.IO)
   */
  private async sendPush(data: NotificationJobData, attempts: number): Promise<any> {
    const operation = 'sendPush';
    this.logger.log(`[${operation}] Sending push notification to user ${data.recipientId} for event ${data.event}`);

    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: data.recipientId },
        select: { pushToken: true },
      });

      if (!user) {
        this.logger.warn(`[${operation}] User ${data.recipientId} not found`);
        return { success: false, error: 'User not found' };
      }

      // Send via Socket.IO (real-time)
      const isOnline = this.notificationGateway.emitToUser(data.recipientId, data.event, data.payload);

      // If user has push token and is offline, you could integrate with FCM here
      // For now, we rely on Socket.IO
      if (!isOnline && user.pushToken) {
        this.logger.log(`[${operation}] User is offline but has push token. FCM integration needed.`);
        // TODO: Integrate with Firebase Cloud Messaging (FCM) for offline push notifications
      }

      this.logger.log(`[${operation}] Push notification sent (online: ${isOnline})`);
      return { success: true, channel: 'push', online: isOnline };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[NotificationQueue] Notification job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[NotificationQueue] Notification job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  }
}
