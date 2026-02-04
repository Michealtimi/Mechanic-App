import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { PaymentModule } from 'src/payment/payments.module';
import { AuditModule } from 'src/audit/audit.module';
import { NotificationModule } from 'src/notification/notification.module';
import { AppEcosystemModule } from 'src/app-ecosystem/app-ecosystem.module';
import { RevenueSharingModule } from 'src/revenue-sharing/revenue-sharing.module';
import { LocationModule } from 'src/location/location.module';
import { SlaModule } from 'src/sla/sla.module';
import { ApiModule } from 'src/api/api.module';
import { ReceiptModule } from 'src/receipt/receipt.module';
import { NOTIFICATION_GATEWAY_TOKEN } from 'src/common/interfaces/notification-gateway.interface';
import { MAPS_SERVICE_TOKEN } from 'src/common/interfaces/maps-service.interface';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { GoogleMapsService } from 'src/api/google-maps.service';

@Module({
  controllers: [BookingController],
  providers: [
    BookingService,
    { provide: NOTIFICATION_GATEWAY_TOKEN, useExisting: NotificationGateway },
    { provide: MAPS_SERVICE_TOKEN, useExisting: GoogleMapsService },
  ],
  imports: [
    PaymentModule,
    WalletModule,
    AuditModule,
    NotificationModule,
    AppEcosystemModule,
    RevenueSharingModule,
    LocationModule,
    SlaModule,
    ApiModule,
    ReceiptModule,
  ],
})
export class BookingModule {}
