/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { DispatchTimeoutCron } from './dispatch-timeout.cron';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { LocationModule } from '../location/location.module';
import { SlaModule } from 'src/sla/sla.module';

@Module({
  providers: [DispatchService, DispatchTimeoutCron, PrismaService, NotificationGateway],
  controllers: [DispatchController],
  imports: [LocationModule, SlaModule],
  exports: [DispatchService],
})
export class DispatchModule {}