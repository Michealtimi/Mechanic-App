// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from '../utils/mail.service';

import { RolesGuard } from 'src/common/guard/roles.guards';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      // No need to import ConfigModule here as it's global
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' }, // Example expiration
      }),
      inject: [ConfigService],
      global: true,
    }),
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
