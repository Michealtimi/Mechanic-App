"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const mechanic_module_1 = require("./mechanic/mechanic.module");
const booking_module_1 = require("./booking/booking.module");
const mail_service_1 = require("./utils/mail.service");
const dispute_module_1 = require("./dispute/dispute.module");
const payment_module_1 = require("./paymnet/payment.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            mechanic_module_1.MechanicModule,
            booking_module_1.BookingModule,
            payment_module_1.PaymentModule,
            dispute_module_1.DisputeModule,
        ],
        providers: [mail_service_1.MailService],
        exports: [mail_service_1.MailService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map