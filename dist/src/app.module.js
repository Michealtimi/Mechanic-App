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
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const mechanic_module_1 = require("./mechanic/mechanic.module");
const schedule_1 = require("@nestjs/schedule");
const booking_module_1 = require("./booking/booking.module");
const mail_service_1 = require("./utils/mail.service");
const dispute_module_1 = require("./dispute/dispute.module");
const audit_module_1 = require("./audit/audit.module");
const notification_module_1 = require("./notification/notification.module");
const chat_module_1 = require("./chat/chat.module");
const dispatch_module_1 = require("./dispatch/dispatch.module");
const rating_module_1 = require("./rating/rating.module");
const ev_module_1 = require("./ev/ev.module");
const sla_module_1 = require("./sla/sla.module");
const payments_module_1 = require("./paymnet/payments.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 20,
                },
                {
                    name: 'short-burst',
                    ttl: 5000,
                    limit: 5,
                },
                {
                    name: 'login-attempts',
                    ttl: 60000,
                    limit: 5,
                }
            ]),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            mechanic_module_1.MechanicModule,
            booking_module_1.BookingModule,
            payments_module_1.PaymentModule,
            dispute_module_1.DisputeModule,
            audit_module_1.AuditModule,
            notification_module_1.NotificationModule,
            chat_module_1.ChatModule,
            dispatch_module_1.DispatchModule,
            rating_module_1.RatingModule,
            ev_module_1.EvCertModule,
            sla_module_1.SlaModule,
        ],
        providers: [
            mail_service_1.MailService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
        exports: [mail_service_1.MailService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map