import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { CacheService } from 'src/common/cache/cache.service';
import {
  PLATFORM_CONFIG_KEYS,
  DEFAULT_PLATFORM_CONFIG,
} from './platform.config';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class PlatformConfigService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Get config value: cache → env → DB (PlatformConfig) → default.
   */
  async get(key: string): Promise<string> {
    const cacheKey = `platform_config:${key}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached !== undefined) return cached;

    const envKey = key;
    const envVal = this.configService.get<string>(envKey);
    if (envVal != null && envVal !== '') {
      this.cache.set(cacheKey, envVal, CACHE_TTL_MS);
      return envVal;
    }

    try {
      const row = await this.prisma.platformConfig.findUnique({
        where: { key },
      });
      if (row) {
        this.cache.set(cacheKey, row.value, CACHE_TTL_MS);
        return row.value;
      }
    } catch {
      // Table might not exist yet
    }
    const def = DEFAULT_PLATFORM_CONFIG[key] ?? '';
    this.cache.set(cacheKey, def, CACHE_TTL_MS);
    return def;
  }

  async getNumber(key: string, defaultValue: number): Promise<number> {
    const s = await this.get(key);
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : defaultValue;
  }

  async getInt(key: string, defaultValue: number): Promise<number> {
    const n = await this.getNumber(key, defaultValue);
    return Math.floor(n);
  }

  /** Invisible Foreman: dispatch radius in km (global). */
  async getDispatchRadiusKm(): Promise<number> {
    return this.getNumber(PLATFORM_CONFIG_KEYS.DISPATCH_RADIUS_KM, 10);
  }

  /** Invisible Foreman: geofence radius in metres (mechanic must be within to set IN_PROGRESS). */
  async getGeofenceRadiusMetres(): Promise<number> {
    return this.getInt(PLATFORM_CONFIG_KEYS.GEOFENCE_RADIUS_METRES, 200);
  }

  /** Invisible Foreman: first wave size (e.g. 3 mechanics). */
  async getDispatchFirstWaveSize(): Promise<number> {
    return this.getInt(PLATFORM_CONFIG_KEYS.DISPATCH_FIRST_WAVE_SIZE, 3);
  }

  /** Invisible Foreman: second wave size after timeout (e.g. 5 mechanics). */
  async getDispatchSecondWaveSize(): Promise<number> {
    return this.getInt(PLATFORM_CONFIG_KEYS.DISPATCH_SECOND_WAVE_SIZE, 5);
  }

  /** Invisible Foreman: offer timeout in ms (e.g. 2 min = 120000). */
  async getDispatchOfferTimeoutMs(): Promise<number> {
    return this.getInt(PLATFORM_CONFIG_KEYS.DISPATCH_OFFER_TIMEOUT_MS, 120000);
  }

  /** Editable platform commission (percent). Used when booking has no stored platformFee. */
  async getPlatformCommissionPercent(): Promise<number> {
    return this.getNumber(PLATFORM_CONFIG_KEYS.PLATFORM_COMMISSION_PERCENT, 10);
  }

  /** Set config in DB (for editable commission etc.). Invalidates cache. */
  async set(key: string, value: string): Promise<void> {
    this.cache.delete(`platform_config:${key}`);
    await this.prisma.platformConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
