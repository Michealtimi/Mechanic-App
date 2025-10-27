export interface IPaymentGateway {
    initializePayment(args: {
        amount: number;
        email: string;
        metadata?: any;
    }): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<{
        status: 'success' | 'failed' | 'pending';
        amount: number;
        raw: any;
    }>;
    createSubaccount(args: {
        businessName: string;
        bankCode: string;
        accountNumber: string;
        percentageCharge: number;
    }): Promise<{
        subaccountId: string;
    }>;
}
