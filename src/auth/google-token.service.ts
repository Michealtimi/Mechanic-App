import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GoogleTokenInfo {
  email?: string;
  email_verified?: string | boolean;
  sub?: string;
  aud?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

@Injectable()
export class GoogleTokenService {
  private readonly logger = new Logger(GoogleTokenService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Verifies Google ID token via Google tokeninfo endpoint.
   * Set GOOGLE_CLIENT_ID in production to enforce audience.
   */
  async verifyIdToken(idToken: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    googleSub: string;
  }> {
    try {
      const { data } = await axios.get<GoogleTokenInfo>(
        'https://oauth2.googleapis.com/tokeninfo',
        { params: { id_token: idToken }, timeout: 10000 },
      );

      const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
      if (clientId && data.aud !== clientId) {
        throw new UnauthorizedException('Invalid Google token audience');
      }

      const verified =
        data.email_verified === true || data.email_verified === 'true';
      if (!verified || !data.email) {
        throw new UnauthorizedException('Google email not verified');
      }

      const nameParts = (data.name || '').split(' ');
      return {
        email: data.email.toLowerCase(),
        firstName: data.given_name || nameParts[0] || 'User',
        lastName: data.family_name || nameParts.slice(1).join(' ') || '',
        googleSub: data.sub || '',
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.warn(`Google token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}
