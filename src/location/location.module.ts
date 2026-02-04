import { Module } from '@nestjs/common';
import { GeoController } from './location.controller';
import { GeoService } from './geo.service';
import { PrismaModule } from 'prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [PrismaModule, NotificationModule, ApiModule],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class LocationModule {}
