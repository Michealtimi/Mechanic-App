import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { ITelemetryAdapter, TelemetryData } from './interfaces/telemetry-adapter.interface';
import { SmartcarAdapter } from './adapters/smartcar.adapter';
import { TorLocoAdapter } from './adapters/tor-loco.adapter';
import { ManualAdapter } from './adapters/manual.adapter';
import { TelemetryService } from './telemetry.service';
import { Decimal } from '@prisma/client/runtime/library';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class TelemetryAdapterService {
  private readonly logger = new Logger(TelemetryAdapterService.name);
  private readonly adapters: Map<string, ITelemetryAdapter> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TelemetryService))
    private readonly telemetryService: TelemetryService,
  ) {
    // Initialize adapters
    this.adapters.set('SMARTCAR', new SmartcarAdapter(httpService, configService));
    this.adapters.set('TOR_LOCO', new TorLocoAdapter(httpService, configService));
    this.adapters.set('MANUAL', new ManualAdapter());
  }

  /**
   * Sync telemetry from external provider
   */
  async syncTelemetry(
    vehicleId: string,
    provider: string,
    accessToken: string,
  ): Promise<TelemetryData> {
    const operation = `Sync telemetry for vehicle ${vehicleId} from ${provider}`;
    this.logger.log(`[${operation}]`);

    try {
      const adapter = this.adapters.get(provider.toUpperCase());
      if (!adapter) {
        throw new BadRequestException(`Unsupported telemetry provider: ${provider}`);
      }

      // Fetch telemetry from provider
      const telemetryData = await adapter.fetchTelemetry(vehicleId, accessToken);

      // Get vehicle to check tenant
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }

      // Record telemetry in database
      await this.telemetryService.recordMetric(
        {
          vehicleId,
          batteryLevel: telemetryData.batteryLevel,
          soc: telemetryData.soc,
          rangeKm: telemetryData.rangeKm,
          source: provider.toUpperCase() as any,
        },
        'SYSTEM', // System user for automated sync
        'SYSTEM' as any,
        vehicle.tenantId || '',
      );

      // Update vehicle location if available
      try {
        const location = await adapter.fetchLocation(vehicleId, accessToken);
        await this.prisma.vehicle.update({
          where: { id: vehicleId },
          data: {
            lat: new Decimal(location.latitude),
            lng: new Decimal(location.longitude),
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to update vehicle location: ${error.message}`);
      }

      this.logger.log(`[${operation}] Successfully synced telemetry`);
      return telemetryData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to sync telemetry');
    }
  }

  /**
   * Get available telemetry providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Validate provider access token
   */
  async validateProviderToken(provider: string, accessToken: string): Promise<boolean> {
    const adapter = this.adapters.get(provider.toUpperCase());
    if (!adapter) {
      return false;
    }

    try {
      return await adapter.validateToken(accessToken);
    } catch (error) {
      this.logger.error(`Token validation failed for ${provider}: ${error.message}`);
      return false;
    }
  }
}
