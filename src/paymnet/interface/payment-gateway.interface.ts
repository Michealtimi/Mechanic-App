// src/modules/payment/interface/payment-gateway.interface.ts

export interface InitializePaymentData {
  amount: number; // amount in smallest currency unit (kobo, cents)
  email: string;
  metadata?: Record<string, any>;
  subaccountCode?: string; // Add this if you support splitting payments at init
  percentageCharge?: number; // Add this if gateway allows setting platform fees at init
}

export interface VerifyPaymentResult {
  status: 'success' | 'failed' | 'pending' | 'abandoned' | 'cancelled'; // Added more statuses for completeness
  amount: number;
  raw?: any; // full response from the gateway
}

export interface CreateSubaccountData {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge: number; // e.g. 0.1 for 10%
  // Add other fields relevant to subaccount creation (e.g., description, settlement_bank, etc. depending on gateway)
}

export interface CreateSubaccountResult {
  subaccountId: string; // The ID or code returned by the gateway for the subaccount
  raw?: any; // full response from the gateway
  [key: string]: any; // Allow for other properties the gateway might return
}

// <<< NEW INTERFACES FOR TRANSFERS >>>
export interface TransferRequest {
  amount: number; // Smallest unit, e.g., kobo
  bankAccountNumber: string;
  bankCode: string;
  recipientName: string; // Name of the person/business receiving the transfer
  internalReference: string; // Your unique reference for this transfer
  email?: string; // Recipient's email, if required by gateway
  currency?: string; // e.g., 'NGN' (important for some multi-currency gateways)
  reason?: string; // Reason for the transfer
}

export interface TransferResponse {
  success: boolean;
  providerRef?: string; // Gateway's unique reference for the transfer (e.g., Paystack's transfer_code)
  message?: string; // Success or error message from the gateway
  raw?: any; // Raw response from the gateway
}

export interface IPaymentGateway {
  initializePayment(data: InitializePaymentData): Promise<{ paymentUrl: string; reference: string; raw?: any }>; // Added raw to init response
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  createSubaccount(data: CreateSubaccountData): Promise<CreateSubaccountResult>;
  
  // <<< NEW METHOD FOR PAYOUT TRANSFERS >>>
  initiateTransfer(request: TransferRequest): Promise<TransferResponse>; 
}