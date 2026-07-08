// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { JwtStrategy } from './guard/jwt.strategy';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { getJwtAccessSecret } from 'src/config/jwt.config';
import { GoogleTokenService } from './google-token.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: getJwtAccessSecret(configService),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES') || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleTokenService,
    PrismaService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService, GoogleTokenService],
})
export class AuthModule {}
