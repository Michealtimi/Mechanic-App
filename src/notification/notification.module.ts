// src/modules/notifications/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { SmsStrategy } from './strategy/sms.strategy';
import { MailService } from '../../utils/mail.service'; // ⬅️ UPDATED PATH to src/utils
import { UsersService } from '../users/users.service'; // Adjust path if needed
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
    MailService,
    PrismaService, // Provide PrismaService here if it's not provided by UsersModule or globally.
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationModule {}