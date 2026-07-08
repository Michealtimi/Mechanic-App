// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core'; // Import APP_GUARD for global guard
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppThrottlerModule } from './common/throttler/throttler.module';
import { TenantGuard } from './common/guard/tenant.guard';
import { JwtAuthGuard } from './auth/guard/jwt.guard';
import { CronModule } from './cron/cron.module';
import { PayoutModule } from './payout/payout.module';
import { SubaccountModule } from './subaccount/subAccount.module';
import { StorageModule } from './storage/storage.module';

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
import {
  envValidationSchema,
  envValidationOptions,
} from './config/env.validation';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    SharedModule,
    CacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),

    AppThrottlerModule,

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
    CronModule,
    PayoutModule,
    SubaccountModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // Add other global providers if any
  ],
})
export class AppModule {}
