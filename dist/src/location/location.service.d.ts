import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prisma/client';
interface MechanicWithDistance extends User {
    distance: number;
}
export declare class GeoService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    updateMechanicLocation(mechanicId: string, lat: number, lng: number): Promise<User>;
    findNearbyMechanics(lat: number, lng: number, radiusKm?: number): Promise<MechanicWithDistance[]>;
}
export {};
