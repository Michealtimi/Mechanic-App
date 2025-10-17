export interface PaymentGateway {
  createCharge(amount: number, currency: string, metadata: any): Promise<{ reference: string, checkoutUrl?: string }>;
  verifyPayment(reference: string): Promise<{ success: boolean, reference: string, amount: number, gatewayResponse?: any }>;
  initiatePayout(beneficiaryDetails: any, amount: number): Promise<{ success: boolean, providerRef?: string }>;
  // partialRefund or capture depending on gateway support
  partialRefund?(reference: string, amount: number): Promise<{ success: boolean }>;
}