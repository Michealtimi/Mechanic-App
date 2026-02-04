// Refactored src/mail/mail.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// You can remove the MailData interface since it's not used.

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    // ... (Your existing transporter setup, it's good as is)
  }

  // Your generic sendMail is excellent and should be kept as-is
  async sendMail(to: string, subject: string, text: string, html?: string) {
    // ... (Your existing sendMail method)
  }

  /**
   * ✅ Refactored for Mechanic App: sendWelcomeEmail
   * This version is more generic and reusable for different roles.
   * It also takes `data` as an object, which is a cleaner pattern.
   */
  async sendWelcomeEmail(
    to: string,
    data: { name: string; role: string; password?: string; shopName?: string },
  ) {
    const { name, role, password, shopName } = data;
    const subject = `Welcome to the Mechanic App, ${name}!`;

    const text = `
Hi ${name},
Your account as a ${role} has been created.
${shopName ? `Shop Name: ${shopName}` : ''}
${password ? `Password: ${password}` : ''}
`;

    // 💡 Note: I'm not including the full HTML here for brevity.
    // The key change is to make the HTML content dynamic based on the 'role' and 'shopName'.
    const html = `
      <div style="...">
        ...
        <p>Welcome to the Mechanic App as a <strong>${role}</strong>.</p>
        ${shopName ? `<p>Your shop name: <strong>${shopName}</strong></p>` : ''}
        ${password ? `<p>Your temporary password: <strong>${password}</strong></p>` : ''}
      </div>
    `;

    return this.sendMail(to, subject, text, html);
  }

  /**
   * ✅ New Method for Mechanic Account Approval
   * This is a new method for when a mechanic's account is approved.
   */
  async sendMechanicAccountApproved(to: string, name: string) {
    const subject = `✅ Your Mechanic Account Has Been Approved!`;
    const text = `Hello ${name}, your mechanic account has been approved. You can now log in.`;
    const html = `
      <h3>Hello ${name},</h3>
      <p>Your mechanic account has been approved. You can now log in and access your portal.</p>
    `;
    return this.sendMail(to, subject, text, html);
  }

  // You can remove all the patient/clinic-specific methods
  // (sendAccountApprovalEmail, sendAppointmentNotificationToPatient, etc.)
  // and replace them with methods relevant to a mechanic app.
}