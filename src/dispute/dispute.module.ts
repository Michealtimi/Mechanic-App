import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { PrismaModule } from 'prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from 'src/paymnet/payment.module';
import { DisputeController } from './dispute.controller';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule, // To use WalletService
    PaymentModule, // To use PaymentService
    AuditModule,
  ],
  providers: [DisputeService],
  controllers: [DisputeController], // Uncomment if you create a controller
  exports: [DisputeService],
})
export class DisputeModule {}