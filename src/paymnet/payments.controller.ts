// src/modules/payment/payment.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  Headers, 
  UsePipes,
  ValidationPipe,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from './payment.services';

@Controller('payments')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PaymentController {
  
  private readonly RAW_BODY_KEY = 'rawBody'; // Key used to pass raw body for signature check

  constructor(private readonly paymentService: PaymentService) {}

  // =================================================================
  // 1. Initiate Payment Endpoint (Example)
  // POST /payments/initiate
  // =================================================================
  // NOTE: Assuming DTOs are passed in the request body for simplicity.
  @Post('initiate')
  async initiatePayment() {
    // ⚠️ Replace with DTO and Auth guard logic
    const bookingId = 'mock-b-123'; 
    const userId = 'mock-u-456'; 

    const result = await this.paymentService.initializePayment(bookingId, userId);
    return {
      message: 'Payment initialized. Redirect user to the authorizationUrl.',
      ...result,
    };
  }

  // =================================================================
  // 2. Verify Payment Endpoint (The missing endpoint) 🎯
  // GET /payments/verify?reference={tx_ref}
  // =================================================================
  /**
   * Called by the frontend after the user is redirected back from the payment gateway.
   * This is a client-side verification, which is less reliable than webhooks.
   */
  @Get('verify')
  async verifyPayment(@Query('reference') reference: string) {
    if (!reference) {
        throw new BadRequestException('Transaction reference is required for verification.');
    }
    
    // Delegate to the service's robust verification logic
    const verificationResult = await this.paymentService.verifyPayment(reference);

    return {
      message: 'Payment status retrieved.',
      status: verificationResult.status,
      amount: verificationResult.amount, // in kobo/cents
    };
  }

  // =================================================================
  // 3. Webhook Handler Endpoint (CRITICAL SECURITY POINT) 🔒
  // POST /payments/webhook
  // =================================================================
  /**
   * Called server-to-server by the payment gateway (Paystack/Flutterwave).
   * Note: NestJS setup requires a BodyParser configuration to get the raw body.
   */
  @Post('webhook')
  @HttpCode(200) // Always return 200 OK quickly, even if processing fails
  async handleWebhook(
    @Headers('x-paystack-signature') paystackSignature: string,
    @Headers('verif-hash') flutterwaveSignature: string, // Flutterwave's signature header
    @Body() payload: any,
    // Note: To get the RAW BODY for signature check, you need middleware configuration.
  ) {
    // ⚠️ CRITICAL STEP: The service must handle authentication and processing
    
    const signature = paystackSignature || flutterwaveSignature; // Choose the relevant signature
    // The service method should be adapted to accept the signature/raw body
    
    // For now, we assume the raw body is available, or the service only uses the payload data.
    await this.paymentService.handleWebhook(signature, payload); 

    return { received: true }; 
  }
}