import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    sendMail(to: string, subject: string, text: string, html?: string): Promise<void>;
    sendWelcomeEmail(to: string, data: {
        name: string;
        role: string;
        password?: string;
        shopName?: string;
    }): Promise<void>;
    sendMechanicAccountApproved(to: string, name: string): Promise<void>;
}
