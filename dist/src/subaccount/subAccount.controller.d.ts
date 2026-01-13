import { SubaccountService } from './subaccount.service';
import { CreateSubaccountDto, QuerySubaccountsDto } from './subaccount.dto';
export declare class SubaccountController {
    private readonly subaccountService;
    constructor(subaccountService: SubaccountService);
    createMechanicSubaccount(dto: CreateSubaccountDto, userId: string): Promise<{
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
    getMechanicSubaccount(userId: string): Promise<{
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
    getSubaccountByUserId(userId: string): Promise<{
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
}
