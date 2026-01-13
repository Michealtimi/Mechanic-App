import { PrismaService } from 'prisma/prisma.service';
import { UploadEvCertDto } from './ev.dto';
export declare class EvCertService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    uploadCertification(dto: UploadEvCertDto, callerId: string): Promise<any>;
    verifyCertification(certId: string, verifierId: string): Promise<any>;
    listForMechanic(mechanicId: string): Promise<any>;
}
