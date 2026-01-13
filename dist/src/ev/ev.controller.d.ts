import { EvCertService } from './ev.service';
import { UploadEvCertDto } from './ev.dto';
export declare class EvCertController {
    private readonly evCertService;
    constructor(evCertService: EvCertService);
    upload(req: UserRequest, dto: UploadEvCertDto): Promise<any>;
    list(mechanicId: string): Promise<any>;
    verify(req: UserRequest, certId: string): Promise<any>;
}
