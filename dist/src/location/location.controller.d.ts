import { GeoService } from './geo.service';
import { UpdateLocationDto, GetNearbyMechanicsDto, MechanicGeoResponseDto } from './dto/geo.dto';
export declare class GeoController {
    private geoService;
    constructor(geoService: GeoService);
    updateLocation(mechanicId: string, dto: UpdateLocationDto, req: any): Promise<MechanicGeoResponseDto>;
    getNearby(query: GetNearbyMechanicsDto): Promise<MechanicGeoResponseDto[]>;
    getMechanicLocation(mechanicId: string): Promise<MechanicGeoResponseDto>;
}
