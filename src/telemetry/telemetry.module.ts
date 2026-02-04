import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { TelemetryAdapterService } from './telemetry-adapter.service';
import { EvHealthService } from './ev-health.service';
import { PrismaModule } from 'prisma/prisma.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, VehiclesModule, AuditModule, HttpModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryAdapterService, EvHealthService],
  exports: [TelemetryService, TelemetryAdapterService, EvHealthService],
})
export class TelemetryModule {}
