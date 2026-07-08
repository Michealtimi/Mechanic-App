// src/modules/payment/strategies/sandbox.gateway.ts

import { Injectable, Logger } from '@nestjs/common';
import { IPaymentGateway, InitializePaymentData, CreateSubaccountData, RefundResult } from '../interface/payment-gateway.interface';

@Injectable()
export class SandboxGateway implements IPaymentGateway {
  private readonly logger = new Logger(SandboxGateway.name);
  
  // NOTE: In a real sandbox, you might manage a simple in-memory map of transactions.

  /**
   * Simulates initiating a payment, returning a mock URL and reference.
   */
  async initializePayment(args: InitializePaymentData) {
    this.logger.log(`[SANDBOX] 🚀 Initializing mock payment for ${args.email}`);
    
    // Generate a predictable reference
    const reference = `SANDBOX_REF_${Date.now()}`;
    
    // The paymentUrl is a mock URL that instantly redirects back to simulate success
    const mockPaymentUrl = `${args.metadata?.redirectUrl || 'https://yourapp.com/payment/callback'}?reference=${reference}&status=success`;

    return {
      paymentUrl: mockPaymentUrl,
      reference: reference,
    };
  }

  /**
   * Simulates verifying a transaction reference.
   * Always returns 'success' for simplicity in testing the success path.
   */
  async verifyPayment(reference: string) {
    this.logger.log(`[SANDBOX] 🔍 Verifying mock transaction ${reference}`);
    
    // Simulate a successful transaction result
    const mockAmountKobo = 100000; // 1000 Naira / 10.00 USD (Example)

    return {
      status: 'success' as 'success',
      amount: mockAmountKobo, // Must be in kobo/cents to match contract
      raw: {
        sandbox_status: 'successful',
        sandbox_message: 'Mock transaction approved for testing.',
        reference: reference,
        amount: mockAmountKobo,
      },
    };
  }

  /**
   * Simulates creating a subaccount, returning a mock ID.
   */
  async createSubaccount(args: CreateSubaccountData) {
    this.logger.log(`[SANDBOX] 🏦 Creating mock subaccount for ${args.businessName}`);

    return { 
      subaccountId: `SAB-${args.bankCode}-${Math.random().toString(36).substring(2, 8)}` 
    };
  }

  async initiateTransfer(request: import('../interface/payment-gateway.interface').TransferRequest): Promise<import('../interface/payment-gateway.interface').TransferResponse> {
    this.logger.log(`[SANDBOX] Mock transfer ${request.internalReference} → ${request.recipientName}`);
    return {
      success: true,
      providerRef: `SANDBOX_TRF_${Date.now()}`,
      message: 'Mock transfer succeeded',
      raw: request,
    };
  }

  async refund(reference: string, amount?: number): Promise<RefundResult> {
    this.logger.log(`[SANDBOX] Mock refund for ${reference}${amount != null ? ` (${amount} kobo)` : ''}`);
    return { success: true, message: 'Mock refund', raw: { reference, amount } };
  }
}