/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../utils/constant';

import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { RolesGuard } from 'src/common/guard/roles.guards';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    { provide: APP_GUARD, useClass: RolesGuard }, // RolesGuard applied globally
  ],
})
export class AuthModule {}
