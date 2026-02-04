import { Module } from '@nestjs/common';
import { ExternalMechanicController } from './external-mechanic.controller';
import { ExternalMechanicService } from './external-mechanic.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalMechanicController],
  providers: [ExternalMechanicService],
  exports: [ExternalMechanicService],
})
export class ExternalMechanicModule {}
