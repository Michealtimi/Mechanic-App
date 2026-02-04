import { Module } from '@nestjs/common';
import { ApiKeyController } from './api-key.controller';
import { PublicApiController } from './public-api.controller';
import { ApiKeyService } from './api-key.service';
import { PrismaModule } from 'prisma/prisma.module';
import { BookingModule } from '../booking/booking.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { MechanicModule } from '../mechanic/mechanic.module';

@Module({
  imports: [PrismaModule, BookingModule, VehiclesModule, MechanicModule],
  controllers: [ApiKeyController, PublicApiController],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class PublicApiModule {}
