import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

const cookieExtractor = (req: Request): string | null => {
  if (req.cookies && 'token' in req.cookies) {
    return req.cookies.token;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set in environment variables. Please check your .env file.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.extractJWT, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: secret,
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies && 'token' in req.cookies) {
      return req.cookies.token;
    }
    return null;
  }

  async validate(payload: { id: string; email: string }) {
    return payload; // 👈 this becomes req.user
  }
}

// const cookieExtractor = (req: Request): string | null => {
//   if (req.cookies && 'token' in req.cookies) {
//     return req.cookies.token;
//   }
//   return null;
// };

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         JwtStrategy.extractJWT, // Custom cookie extractor

//       ]),
//       secretOrKey: jwtSecret,
//     });
//   }

//    private static extractJWT(req: Request): string | null {
//     if (req.cookies && 'token' in req.cookies) {
//       return req.cookies.token;
//     }
//     return null;
//   }
//   async validate(payload: {id: string; email: string}) {
//     return payload; // This gets attached to request.user
//   }
// }
