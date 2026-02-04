import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChargingStationController } from './charging-station.controller';
import { ChargingStationService } from './charging-station.service';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [HttpModule, ApiModule],
  controllers: [ChargingStationController],
  providers: [ChargingStationService],
  exports: [ChargingStationService],
})
export class ChargingModule {}
