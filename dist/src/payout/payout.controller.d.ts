import { PayoutService } from './payout.service';
import { RequestPayoutDto, UpdatePayoutStatusDto, ListPayoutsDto, PayoutResponseDto } from './dtos/payout.dtos';
import { UserRequest } from 'src/common/interfaces/user-request.interface';
export declare class PayoutController {
    private readonly payoutService;
    constructor(payoutService: PayoutService);
    requestPayout(req: UserRequest, dto: RequestPayoutDto): Promise<PayoutResponseDto>;
    markPayoutResult(payoutId: string, dto: UpdatePayoutStatusDto): Promise<PayoutResponseDto>;
    getPayout(payoutId: string, req: UserRequest): Promise<PayoutResponseDto>;
    listPayouts(filters: ListPayoutsDto): Promise<{
        data: PayoutResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
