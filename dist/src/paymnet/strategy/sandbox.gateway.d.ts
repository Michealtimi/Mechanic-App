import { IPaymentGateway, InitializePaymentData, CreateSubaccountData } from '../interfaces/payment-gateway.interface';
export declare class SandboxGateway implements IPaymentGateway {
    private readonly logger;
    initializePayment(args: InitializePaymentData): Promise<{
        paymentUrl: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<{
        status: "success";
        amount: number;
        raw: {
            sandbox_status: string;
            sandbox_message: string;
            reference: string;
            amount: number;
        };
    }>;
    createSubaccount(args: CreateSubaccountData): Promise<{
        subaccountId: string;
    }>;
}
