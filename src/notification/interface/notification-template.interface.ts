// A simple interface for templating
export interface NotificationTemplate {
  subject: string;
  htmlBody: string;
  smsBody: string;
}