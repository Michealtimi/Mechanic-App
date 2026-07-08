/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ApiModule } from 'src/api/api.module';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [PrismaModule, NotificationModule, ApiModule, MetricsModule],
  providers: [SlaService],
  controllers: [SlaController],
  exports: [SlaService],
})
export class SlaModule {}