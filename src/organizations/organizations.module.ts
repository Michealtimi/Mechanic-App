import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
// PrismaService is global, no need to import PrismaModule
import { AuditModule } from '../audit/audit.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [AuditModule, WalletModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
