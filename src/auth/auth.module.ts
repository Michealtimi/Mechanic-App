// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../utils/mail.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from 'src/common/guard/roles.guards';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // config is injected dynamically
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    MailService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 👈 global role guard
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
