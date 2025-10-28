import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { PrismaModule } from 'prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from 'src/paymnet/payment.module';
// import { DisputeController } from './dispute.controller'; // Uncomment if you create a controller

@Module({
  imports: [
    PrismaModule,
    WalletModule, // To use WalletService
    PaymentModule, // To use PaymentService
  ],
  providers: [DisputeService],
  // controllers: [DisputeController], // Uncomment if you create a controller
  exports: [DisputeService],
})
export class DisputeModule {}