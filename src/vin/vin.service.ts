import {
  Injectable,
  Logger,
  NotFoundException,
  TooManyRequestsException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { VinNhtsaClient, NormalizedVinResult } from './vin-nhtsa.client';

const RATE_LIMIT_PER_IP_PER_DAY = 5;
const RESULT_TTL_HOURS = 24;

// In-memory rate limit: key = `ip:${date}`, value = count
const ipDayCount = new Map<string, number>();

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRateLimitKey(ip: string): string {
  return `${ip}:${getDateKey()}`;
}

@Injectable()
export class VinService {
  private readonly logger = new Logger(VinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nhtsa: VinNhtsaClient,
  ) {}

  private checkRateLimit(ip: string): void {
    const key = getRateLimitKey(ip);
    const current = ipDayCount.get(key) ?? 0;
    if (current >= RATE_LIMIT_PER_IP_PER_DAY) {
      throw new TooManyRequestsException(
        `VIN check limit reached (${RATE_LIMIT_PER_IP_PER_DAY} per day). Sign up for more.`,
      );
    }
    ipDayCount.set(key, current + 1);
  }

  async checkVin(vin: string, ip?: string, userId?: string): Promise<{ shortId: string; redirectUrl: string }> {
    const normalizedVin = vin.trim().toUpperCase();
    if (ip) this.checkRateLimit(ip);

    const payload: NormalizedVinResult = await this.nhtsa.decode(normalizedVin);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESULT_TTL_HOURS);

    const result = await this.prisma.vinCheckResult.create({
      data: {
        vin: normalizedVin,
        payload: payload as object,
        ip: ip ?? null,
        userId: userId ?? null,
        expiresAt,
      },
    });

    const redirectUrl = `/vin/result/${result.id}`;
    this.logger.log(`VIN check created: ${result.id} for VIN ${normalizedVin}`);
    return { shortId: result.id, redirectUrl };
  }

  async getResult(shortId: string): Promise<{ vin: string; payload: NormalizedVinResult }> {
    const result = await this.prisma.vinCheckResult.findUnique({
      where: { id: shortId },
    });

    if (!result) {
      throw new NotFoundException('VIN result not found or expired');
    }
    if (new Date() > result.expiresAt) {
      await this.prisma.vinCheckResult.delete({ where: { id: shortId } }).catch(() => {});
      throw new NotFoundException('VIN result expired');
    }

    return {
      vin: result.vin,
      payload: result.payload as NormalizedVinResult,
    };
  }
}
