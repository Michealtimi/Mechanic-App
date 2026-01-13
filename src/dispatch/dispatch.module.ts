/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { PrismaService } from 'prisma/prisma.service'; // Needed for DispatchService
import { NotificationGateway } from 'src/notification/notification.gateway'; // Needed for DispatchService

@Module({
  providers: [
    DispatchService, 
    PrismaService, // Required dependency for DispatchService
    NotificationGateway, // Required dependency for DispatchService
  ],
  controllers: [DispatchController],
  imports: [
  ],
  exports: [DispatchService],
})
export class DispatchModule {}