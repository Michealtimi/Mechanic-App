import { DisputeService } from './dispute.service';
import { RaiseDisputeDto, ResolveDisputeDto, DisputeResponseDto } from './dto/dispute.dto';
export declare class DisputeController {
    private readonly disputeService;
    constructor(disputeService: DisputeService);
    raiseDispute(dto: RaiseDisputeDto, req: any): Promise<DisputeResponseDto>;
    listAllDisputes(): Promise<DisputeResponseDto[]>;
    getDisputeById(id: string): Promise<DisputeResponseDto>;
    resolveDispute(id: string, dto: ResolveDisputeDto): Promise<DisputeResponseDto>;
}
