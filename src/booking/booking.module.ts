import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { PrismaModule } from 'prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { PaymentModule } from 'src/paymnet/payment.module';
import { AuditModule } from 'src/audit/audit.module';
import { NotificationModule } from 'src/notification/notification.module';
// Assuming NotificationGateway is provided in a NotificationModule
// import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [BookingController],
  providers: [BookingService],
  imports: [
    PrismaModule, // Prisma service is required to access DB
    PaymentModule, // To use PaymentService
    WalletModule, // To use WalletService
    AuditModule, // To use AuditService
    NotificationModule, // To use NotificationGateway
  ],
})
export class BookingModule {}
