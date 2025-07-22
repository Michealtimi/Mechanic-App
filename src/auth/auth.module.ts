import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'prisma/prisma.module';
import {JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';


@Module({
  imports: [JwtModule, PrismaModule ,PassportModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
