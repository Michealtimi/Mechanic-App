import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {
  ITelemetryAdapter,
  TelemetryData,
  LocationData,
  HealthStatus,
} from '../interfaces/telemetry-adapter.interface';

@Injectable()
export class TorLocoAdapter implements ITelemetryAdapter {
  readonly providerName = 'TOR_LOCO';
  private readonly logger = new Logger(TorLocoAdapter.name);
  private readonly baseUrl = 'https://api.torloco.com/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchTelemetry(vehicleId: string, accessToken: string): Promise<TelemetryData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/vehicles/${vehicleId}/telemetry`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-API-Key': this.configService.get<string>('TOR_LOCO_API_KEY') || '',
          },
        }),
      );

      const data = response.data;

      return {
        vehicleId,
        batteryLevel: data.battery_percentage,
        soc: data.battery_percentage ? data.battery_percentage / 100 : undefined,
        rangeKm: data.estimated_range_km,
        chargingStatus: this.mapChargingStatus(data.charging_status),
        odometerKm: data.odometer_km,
        timestamp: new Date(data.timestamp || Date.now()),
        rawData: data,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch telemetry for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  async fetchLocation(vehicleId: string, accessToken: string): Promise<LocationData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/vehicles/${vehicleId}/location`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-API-Key': this.configService.get<string>('TOR_LOCO_API_KEY') || '',
          },
          timeout: 10000,
        }).pipe(timeout(10000)),
      );

      return {
        vehicleId,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        heading: response.data.heading,
        speed: response.data.speed_kmh,
        timestamp: new Date(response.data.timestamp || Date.now()),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch location for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  async fetchHealthStatus(vehicleId: string, accessToken: string): Promise<HealthStatus> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/vehicles/${vehicleId}/health`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-API-Key': this.configService.get<string>('TOR_LOCO_API_KEY') || '',
          },
          timeout: 10000,
        }).pipe(timeout(10000)),
      );

      const health = response.data;

      return {
        vehicleId,
        overallHealth: this.mapOverallHealth(health.health_score),
        batteryHealth: health.battery_health,
        tirePressure: health.tire_pressure,
        maintenanceAlerts: health.alerts || [],
        timestamp: new Date(health.timestamp || Date.now()),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch health status for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/auth/validate`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-API-Key': this.configService.get<string>('TOR_LOCO_API_KEY') || '',
          },
          timeout: 10000,
        }).pipe(timeout(10000)),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapChargingStatus(status: string): TelemetryData['chargingStatus'] {
    const statusMap: Record<string, TelemetryData['chargingStatus']> = {
      charging: 'CHARGING',
      not_charging: 'NOT_CHARGING',
      fully_charged: 'FULLY_CHARGED',
    };
    return statusMap[status?.toLowerCase()] || 'NOT_CHARGING';
  }

  private mapOverallHealth(score: number): HealthStatus['overallHealth'] {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'FAIR';
    if (score >= 30) return 'POOR';
    return 'CRITICAL';
  }
}
