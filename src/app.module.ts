// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core'; // Import APP_GUARD for global guard
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // Import Throttler

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingModule } from './booking/booking.module';
import { MailService } from './utils/mail.service'; // Note: MailService might need to be in a shared module and exported
import { DisputeModule } from './dispute/dispute.module';
import { AuditModule } from './audit/audit.module'; // Corrected path: src/audit -> ./audit
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { RatingModule } from './rating/rating.module';
import { EvCertModule } from './ev/ev.module';
import { SlaModule } from './sla/sla.module';
import { PaymentModule } from './paymnet/payments.module';
// import { PrismaModule } from './prisma/prisma.module'; // If you're using a dedicated PrismaModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule global
    }),

    // ThrottlerModule configuration:
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Default: 60 seconds (1 minute)
        limit: 20,  // Default: Max 20 requests per minute
      },
      // You can add named rules for specific scenarios if needed
      {
        name: 'short-burst', // Example: for bursty chat messages
        ttl: 5000, // 5 seconds
        limit: 5,  // 5 requests every 5 seconds
      },
      {
        name: 'login-attempts', // Example: for login brute force protection
        ttl: 60000, // 1 minute
        limit: 5,   // Only 5 login attempts per minute per IP/user
      }
    ]),

    ScheduleModule.forRoot(),

    // Your feature modules
    AuthModule,
    UsersModule,
    MechanicModule,
    BookingModule,
    PaymentModule,
    DisputeModule,
    AuditModule,
    NotificationModule,
    ChatModule,
    DispatchModule,
    RatingModule,
    EvCertModule,
    SlaModule,
    ScheduleModule.forRoot()
    // PrismaModule, // If you created a dedicated PrismaModule
  ],
  providers: [
    MailService, // Consider if MailService needs its own module and export for wider use
    // Apply ThrottlerGuard globally to all HTTP endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Add other global providers if any
  ],
  exports: [MailService], // If MailService is meant to be used by other modules, export it
})
export class AppModule {}