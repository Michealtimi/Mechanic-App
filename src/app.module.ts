// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { BookingModule } from './booking/booking.module';
import { MailService } from './utils/mail.service';
import { DisputeModule } from './dispute/dispute.module';
import { PaymentModule } from './paymnet/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule global
    }),
    AuthModule,
    UsersModule,
    MechanicModule,   
    BookingModule,
    PaymentModule,
    DisputeModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class AppModule {}