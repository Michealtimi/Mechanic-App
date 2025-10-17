// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { BookingModule } from './booking/booking.module';
import { MailService } from './utils/mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule global
    }),
    AuthModule,
    UsersModule,
    MechanicModule,
    BookingModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class AppModule {}