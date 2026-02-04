import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleMapsService } from './google-maps.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [HttpModule, MetricsModule],
  providers: [GoogleMapsService],
  exports: [GoogleMapsService],
})
export class ApiModule {}
