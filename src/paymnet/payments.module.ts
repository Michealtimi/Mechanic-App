// src/modules/payment/payment.module.ts
import { Module, HttpModule } from '@nestjs/common'; // ⬅️ Add HttpModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // ⬅️ Add ConfigModule, ConfigService
import { PaymentController } from './payments.controller';
import { FlutterwaveGateway } from './strategy/flutterwave.gateway';
import { PaystackGateway } from './strategy/paystack.gateway';
import { PrismaService } from 'prisma/prisma.service';
import { SandboxGateway } from './strategy/sandbox.gateway';
import { PaymentService } from './payment.services'; // ⬅️ This should be PaymentsService (plural)
import { PaystackWebhookController } from './paystack-webhook.controller';
import { FlutterwaveWebhookController } from './flutterwave-webhook.controller';
import { WalletService } from 'src/wallet/wallet.service'; // ⬅️ NEW: WalletService import
import { NotificationGateway } from 'src/notification/notification.gateway'; // ⬅️ NEW: NotificationGateway import
import { HttpService } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule, // Needed if gateways use HttpService (Axios)
    ConfigModule, // Needed for ConfigService injection
  ],
  providers: [
    PrismaService,
    PaymentService, // ⬅️ Change to PaymentsService (plural)
    WalletService, // ⬅️ NEW: Provide WalletService
    NotificationGateway, // ⬅️ NEW: Provide NotificationGateway
    {
      provide: 'IPaymentGateway',
      useFactory: (configService: ConfigService, httpService: HttpService) => { // ⬅️ Inject ConfigService and HttpService
        const gatewayName = configService.get<string>('PAYMENT_GATEWAY')?.toUpperCase() || 'SANDBOX';
        
        switch (gatewayName) {
          case 'FLUTTERWAVE':
            return new FlutterwaveGateway(configService, httpService); // Pass dependencies
          case 'PAYSTACK':
            return new PaystackGateway(configService, httpService); // Pass dependencies
          case 'SANDBOX':
            return new SandboxGateway(); 
          default:
            return new SandboxGateway();
        }
      },
      inject: [ConfigService, HttpService], // ⬅️ Explicitly inject dependencies into useFactory
    },
   
  ],
  controllers: [
    PaymentController, // ⬅️ This should probably be a more general client-facing PaymentsController
    PaystackWebhookController,
    FlutterwaveWebhookController,
  ],
  exports: [PaymentService], // ⬅️ Change to PaymentsService (plural)
})
export class PaymentModule {} 