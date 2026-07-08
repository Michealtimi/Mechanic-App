import { ConfigService } from '@nestjs/config';

/** Single source of truth for access-token signing and Passport verification. */
export function getJwtAccessSecret(config: ConfigService): string {
  return (
    config.get<string>('JWT_ACCESS_SECRET') ||
    config.get<string>('JWT_SECRET') ||
    ''
  );
}

export function getJwtRefreshSecret(config: ConfigService): string {
  return (
    config.get<string>('JWT_REFRESH_SECRET') ||
    config.get<string>('JWT_SECRET') ||
    ''
  );
}

export interface JwtUserPayload {
  id: string;
  sub: string;
  email: string;
  role: string;
  tenantId?: string | null;
  jti?: string;
}

/** Normalize Passport user from access/refresh JWT payloads. */
export function normalizeJwtUser(payload: Record<string, unknown>): JwtUserPayload {
  const sub = String(payload.sub ?? payload.id ?? '');
  return {
    id: sub,
    sub,
    email: String(payload.email ?? ''),
    role: String(payload.role ?? ''),
    tenantId: (payload.tenantId as string | null | undefined) ?? null,
    jti: payload.jti as string | undefined,
  };
}
