import { Injectable } from '@nestjs/common';
import {
  ITelemetryAdapter,
  TelemetryData,
  LocationData,
  HealthStatus,
} from '../interfaces/telemetry-adapter.interface';

@Injectable()
export class ManualAdapter implements ITelemetryAdapter {
  readonly providerName = 'MANUAL';

  async fetchTelemetry(vehicleId: string, accessToken: string): Promise<TelemetryData> {
    throw new Error('Manual adapter does not fetch telemetry. Use recordMetric instead.');
  }

  async fetchLocation(vehicleId: string, accessToken: string): Promise<LocationData> {
    throw new Error('Manual adapter does not fetch location. Use vehicle location instead.');
  }

  async fetchHealthStatus(vehicleId: string, accessToken: string): Promise<HealthStatus> {
    throw new Error('Manual adapter does not fetch health status. Use manual health metrics instead.');
  }

  async validateToken(accessToken: string): Promise<boolean> {
    return true;
  }
}
