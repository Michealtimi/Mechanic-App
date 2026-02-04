import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export interface NormalizedVinResult {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  bodyClass?: string;
  engine?: string;
  plantCity?: string;
  plantCountry?: string;
  manufacturer?: string;
  vehicleType?: string;
}

interface NhtsaDecodeResponse {
  Count?: number;
  Results?: Array<Record<string, string>>;
}

@Injectable()
export class VinNhtsaClient {
  private readonly logger = new Logger(VinNhtsaClient.name);

  constructor(private readonly httpService: HttpService) {}

  async decode(vin: string): Promise<NormalizedVinResult> {
    const url = `${NHTSA_BASE}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    this.logger.debug(`Decoding VIN via NHTSA: ${vin}`);

    const { data } = await firstValueFrom(
      this.httpService.get<NhtsaDecodeResponse>(url, { timeout: 10000 }),
    );

    const results = data?.Results;
    if (!results || !Array.isArray(results) || results.length === 0) {
      this.logger.warn(`NHTSA returned no results for VIN ${vin}`);
      return { vin };
    }

    const raw = results[0] as Record<string, string>;
    const get = (key: string): string | undefined => {
      const v = raw[key];
      return v && String(v).trim() !== '' ? String(v).trim() : undefined;
    };
    const yearStr = get('ModelYear');
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const yearNum = Number.isNaN(year as number) ? undefined : year;

    return {
      vin,
      make: get('Make'),
      model: get('Model'),
      year: yearNum as number | undefined,
      bodyClass: get('BodyClass'),
      engine: get('EngineModel'),
      plantCity: get('PlantCity'),
      plantCountry: get('PlantCountry'),
      manufacturer: get('ManufacturerName'),
      vehicleType: get('VehicleType'),
    };
  }
}
