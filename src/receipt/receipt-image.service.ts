import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

export interface ReceiptBookingData {
  id: string;
  vehicle?: { make?: string; model?: string; year?: number; vin?: string } | null;
  service?: { title?: string } | null;
  segments?: Array<{ type: string }>;
  totalPrice?: { toString: () => string };
  mechanic?: { firstName?: string; lastName?: string; shopName?: string } | null;
  completedAt?: Date | null;
}

const PLATFORM_NAME = 'FleetOps';

/**
 * Invisible Foreman: Generates Vehicle Health Certificate (static image) for EV jobs.
 * Uses sharp to render SVG → PNG, saves to uploads/receipts/{bookingId}.png.
 */
@Injectable()
export class ReceiptImageService {
  private readonly logger = new Logger(ReceiptImageService.name);
  private readonly uploadsDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
    try {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  /**
   * Generate receipt image for a completed EV booking. Saves to disk and returns public URL.
   */
  async generate(booking: ReceiptBookingData): Promise<string> {
    const vehicleDesc =
      booking.vehicle?.year && booking.vehicle?.make && booking.vehicle?.model
        ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
        : booking.vehicle?.vin ?? 'Vehicle';
    const serviceTitle = booking.service?.title ?? booking.segments?.[0]?.type ?? 'Service';
    const mechanicName = booking.mechanic
      ? [booking.mechanic.firstName, booking.mechanic.lastName].filter(Boolean).join(' ') || booking.mechanic.shopName || 'Mechanic'
      : 'Mechanic';
    const amount = booking.totalPrice?.toString() ?? '—';
    const date = booking.completedAt
      ? booking.completedAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })
      : new Date().toLocaleDateString('en-NG', { dateStyle: 'medium' });

    const svg = `
<svg width="600" height="820" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="820" fill="url(#bg)"/>
  <rect x="20" y="20" width="560" height="780" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <text x="300" y="72" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a">${escapeXml(PLATFORM_NAME)}</text>
  <text x="300" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Vehicle Health Certificate</text>
  <line x1="80" y1="130" x2="520" y2="130" stroke="#e2e8f0" stroke-width="1"/>
  <text x="80" y="168" font-family="Arial, sans-serif" font-size="14" fill="#334155">Vehicle</text>
  <text x="80" y="192" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(vehicleDesc)}</text>
  <text x="80" y="232" font-family="Arial, sans-serif" font-size="14" fill="#334155">Service</text>
  <text x="80" y="256" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(serviceTitle)}</text>
  <text x="80" y="296" font-family="Arial, sans-serif" font-size="14" fill="#334155">Completed by</text>
  <text x="80" y="320" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(mechanicName)}</text>
  <text x="80" y="360" font-family="Arial, sans-serif" font-size="14" fill="#334155">Amount</text>
  <text x="80" y="384" font-family="Arial, sans-serif" font-size="13" fill="#64748b">₦${escapeXml(amount)}</text>
  <text x="80" y="424" font-family="Arial, sans-serif" font-size="14" fill="#334155">Date</text>
  <text x="80" y="448" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${escapeXml(date)}</text>
  <line x1="80" y1="480" x2="520" y2="480" stroke="#e2e8f0" stroke-width="1"/>
  <text x="80" y="518" font-family="Arial, sans-serif" font-size="13" fill="#334155">✓ Job completed and verified</text>
  <text x="80" y="548" font-family="Arial, sans-serif" font-size="13" fill="#334155">✓ Parts replaced as required</text>
  <text x="80" y="578" font-family="Arial, sans-serif" font-size="13" fill="#334155">✓ 30-day guarantee on workmanship</text>
  <line x1="80" y1="610" x2="520" y2="610" stroke="#e2e8f0" stroke-width="1"/>
  <text x="300" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Powered by ${escapeXml(PLATFORM_NAME)}</text>
  <text x="300" y="688" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#cbd5e1">Share this certificate via WhatsApp</text>
</svg>`;

    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    const filename = `${booking.id}.png`;
    const filePath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const imageUrl = `${baseUrl.replace(/\/$/, '')}/receipts/${filename}`;
    this.logger.log(`Receipt image saved: ${filePath} -> ${imageUrl}`);
    return imageUrl;
  }
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
