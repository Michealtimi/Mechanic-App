import { NotificationChannelStrategy } from '../abstract/notification.strategy';
import { NotificationTemplate } from '../interface/notification-template.interface';
export declare class SmsStrategy implements NotificationChannelStrategy {
    private readonly logger;
    constructor();
    send(to: string, template: NotificationTemplate): Promise<void>;
    getType(): 'SMS';
}
