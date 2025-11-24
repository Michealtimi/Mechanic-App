import { DisputeService } from './dispute.service';
declare class RaiseDisputeDto {
    bookingId: string;
    reason: string;
}
declare class ResolveDisputeDto {
    resolution: string;
    refundAmount: number;
    isRefundToCustomer: boolean;
    isDebitMechanic: boolean;
}
export declare class DisputeController {
    private readonly disputeService;
    constructor(disputeService: DisputeService);
    raiseDispute(dto: RaiseDisputeDto, req: any): Promise<any>;
    listAllDisputes(): Promise<any>;
    resolveDispute(id: string, dto: ResolveDisputeDto): Promise<any>;
}
export {};
