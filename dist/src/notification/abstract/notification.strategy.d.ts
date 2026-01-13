export declare abstract class NotificationChannelStrategy {
    abstract send(to: string, template: NotificationTemplate): Promise<void>;
    abstract getType(): 'EMAIL' | 'SMS' | 'PUSH';
}
