import { Module } from '@nestjs/common';
import { SubaccountController } from './subAccount.controller';
import { SubaccountService } from './subAccount.service';
import { PrismaModule } from 'prisma/prisma.module';
import { PaymentModule } from 'src/payment/payments.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [SubaccountController],
  providers: [SubaccountService],
  exports: [SubaccountService],
})
export class SubaccountModule {}
