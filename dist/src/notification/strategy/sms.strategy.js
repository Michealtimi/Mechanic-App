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
var SmsStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsStrategy = void 0;
const common_1 = require("@nestjs/common");
let SmsStrategy = SmsStrategy_1 = class SmsStrategy {
    logger = new common_1.Logger(SmsStrategy_1.name);
    constructor() {
    }
    async send(to, template) {
        this.logger.log(`[SMS] Sending to ${to}: ${template.smsBody}`);
        return Promise.resolve();
    }
    getType() { return 'SMS'; }
};
exports.SmsStrategy = SmsStrategy;
exports.SmsStrategy = SmsStrategy = SmsStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmsStrategy);
//# sourceMappingURL=sms.strategy.js.map