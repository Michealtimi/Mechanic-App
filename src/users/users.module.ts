import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, PrismaService],
  exports: [UsersService], // ✅ Allow other modules to access UsersService
})
export class UsersModule {}
