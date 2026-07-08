import { Module } from '@nestjs/common';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payouts.service';
import { PrismaModule } from 'prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { PaymentModule } from 'src/payment/payments.module';

@Module({
  imports: [PrismaModule, WalletModule, PaymentModule],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
