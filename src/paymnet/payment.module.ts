// src/modules/payment/payment.module.ts
import { Module } from '@nestjs/common'; // ⬅️ ASSUMED: Added PrismaService import
import { PaymentController } from './payment.controller';
import { FlutterwaveGateway } from './strategy/flutterwave.gateway';
import { PaystackGateway } from './strategy/paystack.gateway';
import { PrismaService } from 'prisma/prisma.service';
import { SandboxGateway } from './strategy/sandbox.gateway';
import { PaymentService } from './payment.services';
import { PaystackWebhookController } from './paystack-webhook.controller';

@Module({
  imports: [
    // Assume you might need HttpModule or ConfigModule here later
  ],
  providers: [
    PrismaService, // ⬅️ Needs to be provided if used by PaymentService
    PaymentService, // ⬅️ Corrected name: This is your primary service
    {
      provide: 'IPaymentGateway',
      useFactory: () => {
        const gateway = process.env.PAYMENT_GATEWAY?.toUpperCase() || 'SANDBOX'; // Default to SANDBOX
        
        switch (gateway) {
          case 'FLUTTERWAVE':
            return new FlutterwaveGateway();
          case 'PAYSTACK':
            return new PaystackGateway();
          case 'SANDBOX': // ⬅️ Explicitly added SANDBOX strategy
            return new SandboxGateway();
          default:
            // Fallback for an unknown provider config
            return new SandboxGateway(); 
        }
      },
    },
    // Optional: Keep individual gateway providers if they have their own dependencies.
  ],
  controllers: [
     PaymentController,
    PaystackWebhookController,
    flutter    // ⬅️ Added // ⬅️ Added

     
  ],
  exports: [PaymentService],
})
export class PaymentModule {}