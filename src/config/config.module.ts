import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PlatformConfigService } from './platform-config.service';

@Global()
@Module({
  providers: [PlatformConfigService, PrismaService],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
