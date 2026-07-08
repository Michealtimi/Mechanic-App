import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getJwtAccessSecret, normalizeJwtUser, JwtUserPayload } from 'src/config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = getJwtAccessSecret(configService);
    if (!secret) {
      throw new Error(
        'JWT access secret is not set. Configure JWT_ACCESS_SECRET or JWT_SECRET in environment.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: secret,
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies && 'token' in req.cookies) {
      return req.cookies.token as string;
    }
    return null;
  }

  validate(payload: Record<string, unknown>): JwtUserPayload {
    return normalizeJwtUser(payload);
  }
}
