import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtStrategy } from 'src/auth/guard/jwt.strategy';
import { PrismaService } from 'prisma/prisma.service';
import { MailService } from 'src/utils/mail.service';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    AuditModule
    // ConfigModule is now global, no need to import here
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, PrismaService, MailService],
  exports: [UsersService], // ✅ Allow other modules to access UsersService
})
export class UsersModule {}
