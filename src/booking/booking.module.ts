import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  controllers: [BookingController],
  providers: [
    BookingService,
    // Guards can be applied globally or in main.ts — optional here
    // JwtAuthGuard,
    // RolesGuard
  ],
  imports: [PrismaModule], // Prisma service is required to access DB
})
export class BookingModule {}
