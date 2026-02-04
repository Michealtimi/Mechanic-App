import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { AiTriageService } from './ai-triage.service';
import { PrismaModule } from 'prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from 'src/payment/payments.module';
import { DisputeController } from './dispute.controller';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    PaymentModule,
    AuditModule,
  ],
  providers: [DisputeService, AiTriageService],
  controllers: [DisputeController],
  exports: [DisputeService, AiTriageService],
})
export class DisputeModule {}