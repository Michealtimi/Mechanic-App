"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let MailService = MailService_1 = class MailService {
    config;
    logger = new common_1.Logger(MailService_1.name);
    transporter;
    constructor(config) {
        this.config = config;
    }
    async sendMail(to, subject, text, html) {
    }
    async sendWelcomeEmail(to, data) {
        const { name, role, password, shopName } = data;
        const subject = `Welcome to the Mechanic App, ${name}!`;
        const text = `
Hi ${name},
Your account as a ${role} has been created.
${shopName ? `Shop Name: ${shopName}` : ''}
${password ? `Password: ${password}` : ''}
`;
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
    async sendMechanicAccountApproved(to, name) {
        const subject = `✅ Your Mechanic Account Has Been Approved!`;
        const text = `Hello ${name}, your mechanic account has been approved. You can now log in.`;
        const html = `
      <h3>Hello ${name},</h3>
      <p>Your mechanic account has been approved. You can now log in and access your portal.</p>
    `;
        return this.sendMail(to, subject, text, html);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map