// src/modules/notifications/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { SmsStrategy } from './strategy/sms.strategy';
import { PrismaService } from 'prisma/prisma.service'; // Adjust path if needed
import { UsersModule } from '../users/users.module'; // Still need UsersModule for UsersService


@Module({
  imports: [
    UsersModule, // Still need to import UsersModule if UsersService is provided there
  ],
  providers: [
    NotificationGateway,
    NotificationService,
    SmsStrategy,
    PrismaService, // Provide PrismaService here if it's not provided by UsersModule or globally.
  ],
  exports: [
    NotificationService,
    NotificationGateway,
  ],
})
export class NotificationModule {}