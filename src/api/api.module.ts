import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MapsService } from './maps.service';
import { MetricsModule } from '../metrics/metrics.module';
import { MAPS_SERVICE_TOKEN } from 'src/common/interfaces/maps-service.interface';

@Module({
  imports: [HttpModule, MetricsModule],
  providers: [
    MapsService,
    {
      provide: MAPS_SERVICE_TOKEN,
      useExisting: MapsService,
    },
  ],
  exports: [MapsService, MAPS_SERVICE_TOKEN],
})
export class ApiModule {}
