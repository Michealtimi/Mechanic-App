import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { jwtSecret } from 'src/utils/constant';






const cookieExtractor = (req: Request): string | null => {
  if (req.cookies && 'token' in req.cookies) {
    return req.cookies.token;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
      ]),
      secretOrKey: jwtSecret ?? 'your_default_jwt_secret',
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

 
