import { PrismaService } from 'prisma/prisma.service';
import { IPaymentGateway } from '../payment/interface/payment-gateway.interface';
import { CreateSubaccountDto } from './subaccount.dto';
export declare class SubaccountService {
    private readonly prisma;
    private readonly gateway;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: IPaymentGateway);
    createMechanicSubaccount(userId: string, dto: CreateSubaccountDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        gateway: string;
        subaccountCode: string;
        bankCode: string;
        accountNumber: string;
        provider: string;
        subaccountId: string;
        percentageCharge: number;
        businessName: string;
        active: boolean;
    }>;
    getSubaccount(userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        mechanicId: string;
        gateway: string;
        subaccountCode: string;
        bankCode: string;
        accountNumber: string;
        provider: string;
        subaccountId: string;
        percentageCharge: number;
        businessName: string;
        active: boolean;
    }>;
    findAll(query: QuerySubaccountsDto): Promise<{
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
        data: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            mechanicId: string;
            gateway: string;
            subaccountCode: string;
            bankCode: string;
            accountNumber: string;
            provider: string;
            subaccountId: string;
            percentageCharge: number;
            businessName: string;
            active: boolean;
        }[];
    }>;
    private assertMechanicEligibility;
}
