// Abstract class for different notification channels (Email, SMS)
export abstract class NotificationChannelStrategy {
  abstract send(to: string, template: NotificationTemplate): Promise<void>;
  abstract getType(): 'EMAIL' | 'SMS' | 'PUSH';
}