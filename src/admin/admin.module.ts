import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from 'prisma/prisma.module';
import { DisputeModule } from '../dispute/dispute.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payment/payments.module';

@Module({
  imports: [PrismaModule, DisputeModule, WalletModule, PaymentModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
