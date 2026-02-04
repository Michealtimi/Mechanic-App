import { Module } from '@nestjs/common';
import { RevenueSharingController } from './revenue-sharing.controller';
import { RevenueSharingService } from './revenue-sharing.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RevenueSharingController],
  providers: [RevenueSharingService],
  exports: [RevenueSharingService],
})
export class RevenueSharingModule {}
