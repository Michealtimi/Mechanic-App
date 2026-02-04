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
export class SmartcarAdapter implements ITelemetryAdapter {
  readonly providerName = 'SMARTCAR';
  private readonly logger = new Logger(SmartcarAdapter.name);
  private readonly baseUrl = 'https://api.smartcar.com/v2.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchTelemetry(vehicleId: string, accessToken: string): Promise<TelemetryData> {
    try {
      const [battery, charge, odometer] = await Promise.all([
        this.getBatteryLevel(vehicleId, accessToken),
        this.getChargeStatus(vehicleId, accessToken),
        this.getOdometer(vehicleId, accessToken),
      ]);

      return {
        vehicleId,
        batteryLevel: battery.percentRemaining,
        soc: battery.percentRemaining / 100,
        rangeKm: charge.range ? charge.range * 1.60934 : undefined,
        chargingStatus: this.mapChargingStatus(charge.isPluggedIn, charge.state),
        odometerKm: odometer.distance ? odometer.distance * 1.60934 : undefined,
        timestamp: new Date(),
        rawData: { battery, charge, odometer },
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
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        }).pipe(timeout(10000)),
      );

      return {
        vehicleId,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch location for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  async fetchHealthStatus(vehicleId: string, accessToken: string): Promise<HealthStatus> {
    try {
      const telemetry = await this.fetchTelemetry(vehicleId, accessToken);
      
      const batteryHealth = telemetry.batteryLevel || 0;
      let overallHealth: HealthStatus['overallHealth'] = 'GOOD';
      
      if (batteryHealth < 20) overallHealth = 'CRITICAL';
      else if (batteryHealth < 40) overallHealth = 'POOR';
      else if (batteryHealth < 70) overallHealth = 'FAIR';
      else if (batteryHealth >= 90) overallHealth = 'EXCELLENT';

      return {
        vehicleId,
        overallHealth,
        batteryHealth,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch health status for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/vehicles`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        }).pipe(timeout(10000)),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getBatteryLevel(vehicleId: string, accessToken: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/vehicles/${vehicleId}/battery`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      }).pipe(timeout(10000)),
    );
    return response.data;
  }

  private async getChargeStatus(vehicleId: string, accessToken: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/vehicles/${vehicleId}/charge`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return response.data;
  }

  private async getOdometer(vehicleId: string, accessToken: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/vehicles/${vehicleId}/odometer`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      }).pipe(timeout(10000)),
    );
    return response.data;
  }

  private mapChargingStatus(
    isPluggedIn: boolean,
    state: string,
  ): TelemetryData['chargingStatus'] {
    if (!isPluggedIn) return 'NOT_CHARGING';
    if (state === 'FULLY_CHARGED') return 'FULLY_CHARGED';
    return 'CHARGING';
  }
}
