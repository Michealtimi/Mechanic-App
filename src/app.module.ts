// src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { BookingModule } from './booking/booking.module';
import { MailService } from './utils/mail.service';

// 🔑 Import the MailService here

@Module({
  imports: [AuthModule, UsersModule, MechanicModule, BookingModule],
  providers: [MailService], // 🔑 Add MailService to the providers array
  exports: [MailService], // 🔑 Export MailService to make it globally available
})
export class AppModule {}