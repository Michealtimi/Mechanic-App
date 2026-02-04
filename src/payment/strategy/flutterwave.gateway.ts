// src/modules/payment/strategies/flutterwave.gateway.ts
import axios, { AxiosError } from 'axios'; // ⬅️ Added AxiosError for type safety
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IPaymentGateway, InitializePaymentData, CreateSubaccountData, VerifyPaymentResult, CreateSubaccountResult, RefundResult } from '../interface/payment-gateway.interface';

@Injectable()
export class FlutterwaveGateway implements IPaymentGateway {
  private readonly logger = new Logger(FlutterwaveGateway.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';
  private readonly secret = process.env.FLW_SECRET_KEY;
  
  // Define currency here for consistency
  private readonly currency = 'NGN'; 

  constructor() {
    if (!this.secret) {
      this.logger.error('FLW_SECRET_KEY is not defined.');
      throw new InternalServerErrorException('Flutterwave configuration missing.');
    }
  }

  private headers() {
    return { Authorization: `Bearer ${this.secret}` };
  }

  /**
   * Handles errors from Axios, logs extensive details for debugging, 
   * and translates to NestJS exceptions.
   */
  private handleError(operation: string, error: unknown) { // ⬅️ Changed type to unknown for safety
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError; // Cast for easier access
      const status = axiosError.response?.status; 
      const message = (axiosError.response?.data as any)?.message || axiosError.message;

      // 1. Deep Debugging Logging 🪵
      this.logger.error(
          `❌ ${operation} failed (HTTP ${status}): ${message}`, 
          { 
              stack: axiosError.stack,
              response_data: axiosError.response?.data, // Log raw external data
              request_url: axiosError.config?.url,       // Log the request endpoint
          }
      );

      // 2. Error Translation 
      if (status === 400) throw new BadRequestException(`Flutterwave error: ${message}`);
      if (status === 404) throw new NotFoundException(`Flutterwave error: ${message}`);
      // Fallback for 401/403 (Bad Secret Key) or 5xx errors
      throw new InternalServerErrorException(`Flutterwave service error: ${message}`);
    }
    
    // Handle non-Axios errors (e.g., local code execution errors)
    this.logger.error(`❌ ${operation} failed (Non-Axios Error): ${String(error)}`, (error as Error).stack);
    throw new InternalServerErrorException(`An unexpected error occurred during ${operation}.`);
  }

  // ----------------------------------------------------------------------
  // 1. initializePayment
  // ----------------------------------------------------------------------
  async initializePayment({ amount, email, metadata }: InitializePaymentData): Promise<{ paymentUrl: string; reference: string; }> {
    const operation = 'Flutterwave Initialize Payment';
    // ⚠️ FIX: Amount conversion should use Math.round to avoid floating point issues 
    // and correctly handle kobo to naira conversion (amount/100).
    const amountInCurrency = Math.round(amount / 100); 

    try {
      this.logger.log(`🚀 ${operation} for ${email}`);
      
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: `FLW-${Date.now()}`,
          amount: amountInCurrency, 
          currency: this.currency,
          redirect_url: metadata?.redirectUrl || 'https://yourapp.com/payment/callback',
          customer: { email },
          meta: metadata,
        },
        { headers: this.headers(), timeout: 15000 },
      );

      return {
        paymentUrl: response.data.data.link,
        reference: response.data.data.tx_ref,
      };
    } catch (err) {
      this.handleError(operation, err);
      throw err; // Ensure function throws on error
    }
  }

  // ----------------------------------------------------------------------
  // 2. verifyPayment
  // ----------------------------------------------------------------------
  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const operation = `Flutterwave Verify ${reference}`;
    try {
      this.logger.log(`🔍 ${operation}`);
      
      const res = await axios.get(`${this.baseUrl}/transactions/${reference}/verify`, {
        headers: this.headers(),
        timeout: 15000,
      });

      const data = res.data.data;
      let status: 'success' | 'failed' | 'pending' = 'pending';
      if (data.status === 'successful') status = 'success';
      else if (data.status === 'failed') status = 'failed';
      
      // Convert amount back to kobo/cents, ensuring integer math (e.g., using Math.round)
      return {
        status,
        amount: Math.round(data.amount * 100), 
        raw: data,
      };
    } catch (err) {
      this.handleError(operation, err);
      throw err; // Ensure function throws on error
    }
  }

  // ----------------------------------------------------------------------
  // 3. createSubaccount
  // ----------------------------------------------------------------------
  async createSubaccount({ businessName, bankCode, accountNumber, percentageCharge }: CreateSubaccountData): Promise<CreateSubaccountResult> {
    const operation = `Flutterwave Create Subaccount for ${businessName}`;
    try {
      this.logger.log(`🏦 ${operation}`);

      // Flutterwave expects split_value as a number (e.g., 0.5 for 50%, or 50 if percent type)
      // Assuming percentageCharge is a fraction (0.0 to 1.0) and split_type: 'percentage' 
      // expects a whole number (1-100), we adjust the logic slightly.
      const splitValue = Math.round(percentageCharge * 100); 

      const res = await axios.post(
        `${this.baseUrl}/subaccounts`,
        {
          account_bank: bankCode,
          account_number: accountNumber,
          business_name: businessName,
          split_type: 'percentage',
          split_value: splitValue, 
        },
        { headers: this.headers(), timeout: 15000 },
      );

 	  return { subaccountId: res.data.data.id };
    } catch (err) {
      this.handleError(operation, err);
      throw err; // Ensure function throws on error
    }
  }

  async initiateTransfer(): Promise<{ success: boolean; message?: string; raw?: any }> {
    this.logger.warn('Flutterwave initiateTransfer not implemented in this gateway.');
    return { success: false, message: 'Not implemented' };
  }

  async refund(reference: string, amount?: number): Promise<RefundResult> {
    const operation = `Flutterwave Refund ${reference}`;
    try {
      this.logger.log(`Refunding transaction ${reference}${amount != null ? ` (${amount} kobo)` : ''}`);
      const body: { amount?: number } = {};
      if (amount != null) body.amount = amount / 100; // Flutterwave uses Naira
      const res = await axios.post(
        `${this.baseUrl}/transactions/${reference}/refund`,
        body,
        { headers: this.headers(), timeout: 15000 },
      );
      const data = res.data?.data;
      const success = res.data?.status === 'success';
      return { success, message: data?.status || (success ? 'Refunded' : 'Failed'), raw: data };
    } catch (err) {
      this.handleError(operation, err);
      throw err;
    }
  }
}