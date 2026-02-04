// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core'; // Import APP_GUARD for global guard
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // Import Throttler
import { TenantGuard } from './common/guard/tenant.guard';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingModule } from './booking/booking.module';
import { SharedModule } from './shared/shared.module';
import { CacheModule } from './common/cache/cache.module';
import { DisputeModule } from './dispute/dispute.module';
import { AuditModule } from './audit/audit.module'; // Corrected path: src/audit -> ./audit
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { RatingModule } from './rating/rating.module';
import { EvCertModule } from './ev/ev.module';
import { SlaModule } from './sla/sla.module';
import { PaymentModule } from './payment/payments.module';
import { QueuesModule } from './queues/queues.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { MetricsModule } from './metrics/metrics.module';
import { LocationModule } from './location/location.module';
import { AdminModule } from './admin/admin.module';
import { ReportingModule } from './reporting/reporting.module';
import { ChargingModule } from './charging/charging.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PublicApiModule } from './public-api/public-api.module';
import { ExternalMechanicModule } from './external-mechanics/external-mechanic.module';
import { RevenueSharingModule } from './revenue-sharing/revenue-sharing.module';
import { AppEcosystemModule } from './app-ecosystem/app-ecosystem.module';
import { VinModule } from './vin/vin.module';
import { PlatformConfigModule } from './config/config.module';
import { PrismaModule } from 'prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    SharedModule,
    CacheModule,
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
    QueuesModule,
    OrganizationsModule,
    VehiclesModule,
    TelemetryModule,
    EncryptionModule,
    MetricsModule,
    LocationModule,
    AdminModule,
    ReportingModule,
    ChargingModule,
    WebhooksModule,
    PublicApiModule,
    ExternalMechanicModule,
    RevenueSharingModule,
    AppEcosystemModule,
    VinModule,
    PlatformConfigModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally to all HTTP endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply TenantGuard globally to enforce multi-tenancy isolation
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // Add other global providers if any
  ],
})
export class AppModule {}