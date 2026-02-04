/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { EvCertService } from './ev.service';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { EvCertController } from './ev.controller';

@Module({
 
  providers: [
    EvCertService, 
    PrismaService,
    RolesGuard, 
  ],
  // 2. Controllers: The class that handles incoming API requests (e.g., /ev-certs).
  controllers: [EvCertController],
  // 3. Exports: Makes EvCertService available to other modules 
  // (e.g., DispatchModule needs to check isEvSpecialist flag).
  exports: [EvCertService], 
})
export class EvCertModule {}