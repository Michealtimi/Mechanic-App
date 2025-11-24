import { SubaccountService } from './subaccount.service';
import { CreateSubaccountDto, QuerySubaccountsDto } from './subaccount.dto';
export declare class SubaccountController {
    private readonly subaccountService;
    constructor(subaccountService: SubaccountService);
    createMechanicSubaccount(dto: CreateSubaccountDto, userId: string): Promise<any>;
    getMechanicSubaccount(userId: string): Promise<any>;
    findAll(query: QuerySubaccountsDto): Promise<any>;
    getSubaccountByUserId(userId: string): Promise<any>;
}
