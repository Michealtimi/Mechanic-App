// src/modules/payment/interface/payment-gateway.interface.ts

export interface InitializePaymentData {
  amount: number; // amount in smallest currency unit (kobo, cents)
  email: string;
  metadata?: Record<string, any>;
}

export interface VerifyPaymentResult {
  status: 'success' | 'failed' | 'pending';
  amount: number;
  raw?: any; // full response from the gateway
}

export interface CreateSubaccountData {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge: number; // e.g. 0.1 for 10%
}

export interface CreateSubaccountResult {
  subaccountId: string;
  [key: string]: any;
}

export interface IPaymentGateway {
  initializePayment(data: InitializePaymentData): Promise<{ paymentUrl: string; reference: string }>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  createSubaccount(data: CreateSubaccountData): Promise<CreateSubaccountResult>;
}
