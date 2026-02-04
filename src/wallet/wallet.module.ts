import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { OrganizationWalletService } from './organization-wallet.service';
import { OrganizationWalletController } from './organization-wallet.controller';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [WalletController, OrganizationWalletController],
  providers: [WalletService, OrganizationWalletService],
  exports: [WalletService, OrganizationWalletService],
})
export class WalletModule {}