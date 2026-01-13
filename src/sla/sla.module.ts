/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { PrismaService } from 'prisma/prisma.service'; 
import { JwtAuthGuard } from 'src/auth/jwt.guard'; 
import { RolesGuard } from 'src/auth/roles.guard'; 

@Module({
  // Providers: Register the service and dependencies
  providers: [
    SlaService, 
    PrismaService, // Service dependency
    JwtAuthGuard, // Controller dependency
    RolesGuard,   // Controller dependency
  ],
  // Controllers: Register the controller
  controllers: [SlaController],
  // Exports: Allow other modules (like Dispatch) to inject and use the service
  exports: [SlaService], 
})
export class SlaModule {}