import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [AuthModule, UsersModule, MechanicModule, BookingModule],
  
})
export class AppModule {}
