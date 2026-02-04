import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'prisma/prisma.service';
import { VinController } from './vin.controller';
import { VinService } from './vin.service';
import { VinNhtsaClient } from './vin-nhtsa.client';

@Module({
  imports: [HttpModule.register({ timeout: 10000 })],
  controllers: [VinController],
  providers: [VinService, VinNhtsaClient, PrismaService],
  exports: [VinService],
})
export class VinModule {}
