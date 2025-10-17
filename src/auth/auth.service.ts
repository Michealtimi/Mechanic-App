// src/auth/auth.service.ts
/* eslint-disable prettier/prettier */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterUserDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Role, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { MailService } from 'src/utils/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /* ----------------- REGISTER (Public & Admin Registration) ----------------- */
  /**
   * Register a new user with specific role and data.
   */
  async register(dto: RegisterUserDto) {
    try {
      // 💡 CONSOLE LOG: Start of operation
      console.log(`Attempting registration for email: ${dto.email}`);

      const exists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (exists) {
        this.logger.warn(
          `Registration failed: Email '${dto.email}' already in use.`,
        );
        throw new BadRequestException('Email already in use');
      }

      const hashedPassword = await this.hashPassword(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          // Fixed: Cast the string role from DTO to the Prisma Role enum
          role: dto.role as Role,
        },
      });

      // Email sending logic is wrapped in its own try/catch to avoid blocking the main registration flow
      try {
        const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        // Fixed: Corrected the number of arguments passed to sendWelcomeEmail
        await this.mailService.sendWelcomeEmail(user.email, {
          name: userName,
          role: user.role,
          // password: dto.password, // Only include if you want to send the initial password
        });
        // 💡 CONSOLE LOG: Email success
        console.log(`Welcome email successfully queued for ${user.email}`);
      } catch (err) {
        this.logger.warn(
          `Welcome email failed for ${user.email}. Error: ${
            (err as any).message || err
          }`,
        );
        // Do not re-throw here, registration succeeded.
      }

      this.logger.log(`User registered successfully with ID: ${user.id}`);
      const { password, ...rest } = user;
      return rest;
    } catch (err) {
      this.logger.error(`Failed to register user ${dto.email}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /* ----------------- LOGIN ----------------- */
  /**
   * Authenticate a user and generate JWTs.
   */
  async login(dto: LoginDto) {
    try {
      // 💡 CONSOLE LOG: Start of operation
      console.log(`Attempting login for email: ${dto.email}`);

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user || !user.password) {
        this.logger.warn(
          `Login failed: Invalid credentials for email '${dto.email}'.`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await this.comparePassword(dto.password, user.password);
      if (!isMatch) {
        this.logger.warn(
          `Login failed: Incorrect password for user '${dto.email}'.`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.getTokensAndStoreRefresh(
        user.id,
        user.email,
        user.role,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      this.logger.log(`User logged in and lastLogin updated for ID: ${user.id}`);
      // 💡 CONSOLE LOG: Login success
      console.log(`Login successful for user ID: ${user.id}`);

      return {
        success: true,
        message: 'Login successful',
        user: plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
        ...tokens,
      };
    } catch (err) {
      this.logger.error(`Failed to log in user ${dto.email}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  /* ----------------- LOGOUT ----------------- */
  /**
   * Revoke a refresh token to log out a user.
   */
  async logout(refreshToken: string) {
    // 💡 CONSOLE LOG: Start of operation
    console.log('Logout initiated.');

    try {
      const payload: any = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const jti = payload.jti;
      const rt = await this.prisma.refreshToken.findUnique({
        where: { id: jti },
      });
      if (!rt) {
        this.logger.warn(`Logout failed: Refresh token with ID ${jti} not found.`);
        throw new BadRequestException('Refresh token not found');
      }

      await this.prisma.refreshToken.update({
        where: { id: jti },
        data: { revoked: true },
      });
      this.logger.log(`Refresh token with ID ${jti} successfully revoked.`);
      // 💡 CONSOLE LOG: Logout success
      console.log(`Token ${jti} revoked.`);

      return { message: 'Logged out' };
    } catch (err) {
      this.logger.error(`Failed to logout (revoke token)`, err.stack);
      // Re-throw specific client errors
      if (err instanceof BadRequestException || err instanceof ForbiddenException) {
        // Forbidden would be thrown if the token is completely invalid/expired during verify
        throw err;
      }
      // Return a gentle success even on error to prevent attacker knowledge on token validity
      return { message: 'Logged out' };
    }
  }

  /* ----------------- REFRESH ----------------- */
  /**
   * Use a valid refresh token to get a new access token.
   */
  async refreshToken(refreshToken: string) {
    try {
      // 💡 CONSOLE LOG: Start of operation
      console.log('Token refresh request started.');

      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        });
      } catch {
        this.logger.error('Invalid refresh token provided during verification.');
        throw new ForbiddenException('Invalid refresh token');
      }

      const jti = payload.jti;
      const userId = payload.sub;
      // 💡 CONSOLE LOG: Payload details
      console.log(`Processing refresh for user ${userId} and token ID ${jti}`);

      const stored = await this.prisma.refreshToken.findUnique({
        where: { id: jti },
      });
      if (!stored || stored.revoked) {
        this.logger.warn(`Refresh token with ID ${jti} is revoked or not found.`);
        throw new ForbiddenException('Refresh token revoked');
      }

      if (stored.expiresAt < new Date()) {
        this.logger.warn(`Refresh token with ID ${jti} is expired. Revoking.`);
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
        throw new ForbiddenException('Refresh token expired');
      }

      const isMatch = await bcrypt.compare(refreshToken, stored.token);
      if (!isMatch) {
        this.logger.error(
          `Hash mismatch for refresh token with ID ${jti}. Revoking token.`,
        );
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
        throw new ForbiddenException('Invalid refresh token');
      }

      // Invalidate the old token
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });
      this.logger.log(`Old refresh token with ID ${jti} revoked.`);

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.error(
          `User with ID ${userId} not found during refresh token process.`,
        );
        throw new ForbiddenException('User not found');
      }

      const newTokens = await this.getTokensAndStoreRefresh(
        user.id,
        user.email,
        user.role,
      );
      this.logger.log(`New access and refresh tokens issued for user ${user.id}`);
      // 💡 CONSOLE LOG: Success
      console.log(`Successfully issued new tokens for user ${user.id}`);
      return newTokens;
    } catch (err) {
      this.logger.error(`Failed to refresh token`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Token refresh failed');
    }
  }

  /* ----------------- FORGOT PASSWORD ----------------- */
  /**
   * Generate a password reset link and send it via email.
   * NOTE: No changes to this method's overall structure, as it must fail gracefully
   * to prevent user enumeration, which conflicts with standard error propagation.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    this.logger.log(`Password reset requested for email: ${dto.email}`);
    // 💡 CONSOLE LOG: Start of operation
    console.log(`Checking user existence for password reset: ${dto.email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      // Fail gracefully to prevent user enumeration attacks
      if (!user) {
        this.logger.log(
          'User not found. Returning generic success message to prevent user enumeration.',
        );
        return { message: 'If an account exists, a reset link was sent.' };
      }

      const resetToken = await this.jwtService.signAsync(
        { sub: user.id },
        { secret: this.config.get<string>('JWT_RESET_SECRET'), expiresIn: '1h' },
      );

      const resetUrl = `${this.config.get<string>(
        'FRONTEND_URL',
      )}/reset-password?token=${resetToken}`;

      await this.mailService.sendMail(
        user.email,
        'Password Reset Request',
        `You requested a password reset. Please click the link to reset your password: ${resetUrl}`,
        `
          <p>Hello ${user.firstName ?? ''},</p>
          <p>You requested a password reset. Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">Reset password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      );
      this.logger.log(`Password reset email sent to ${user.email}`);
      // 💡 CONSOLE LOG: Email success
      console.log(`Password reset email sent to ${user.email}`);

      return { message: 'If an account exists, a reset link was sent.' };
    } catch (err) {
      this.logger.error(`Failed to process forgot password for ${dto.email}`, err.stack);
      // Re-throw specific client errors only if it's NOT the email sending error
      // In this case, we throw a generic one unless it's a known client error (none here)
      throw new InternalServerErrorException('Failed to process password reset');
    }
  }

  /* ----------------- RESET PASSWORD ----------------- */
  /**
   * Reset a user's password using a valid reset token.
   */
  async resetPassword(dto: ResetPasswordDto) {
    try {
      // 💡 CONSOLE LOG: Start of operation
      console.log('Password reset request with token received.');

      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(dto.token, {
          secret: this.config.get<string>('JWT_RESET_SECRET'),
        });
      } catch {
        this.logger.error('Invalid or expired reset token provided.');
        throw new ForbiddenException('Invalid or expired reset token');
      }

      const userId = payload.sub;
      // 💡 CONSOLE LOG: Processing user ID
      console.log(`Processing password reset for user ID: ${userId}`);

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.warn(
          `Password reset failed: User with ID ${userId} not found.`,
        );
        throw new BadRequestException('User not found');
      }

      const hashed = await this.hashPassword(dto.newPassword);
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashed },
      });
      this.logger.log(`Password successfully reset for user ID: ${userId}`);
      // 💡 CONSOLE LOG: Success
      console.log(`Password successfully reset for user ID: ${userId}`);

      return { message: 'Password reset successful' };
    } catch (err) {
      this.logger.error(`Failed to reset password for token`, err.stack);
      // Re-throw specific client errors
      if (err instanceof ForbiddenException || err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  /* ----------------- HELPER METHODS ----------------- */

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private async comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }

  private async getTokensAndStoreRefresh(
    userId: string,
    email: string,
    role: Role,
  ) {
    try {
      // 💡 CONSOLE LOG: Start of operation
      console.log(`Generating tokens and storing refresh for user ${userId}`);

      const jti = uuidv4();

      const accessPayload = { sub: userId, email, role };
      const refreshPayload = { sub: userId, email, role, jti };

      const accessToken = await this.jwtService.signAsync(accessPayload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m',
      });

      const refreshToken = await this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES') || '7d',
      });

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(
        Date.now() +
          this.parseDurationToMs(
            this.config.get<string>('JWT_REFRESH_EXPIRES') || '7d',
          ),
      );

      await this.prisma.refreshToken.create({
        data: {
          id: jti,
          token: hashedRefreshToken,
          userId,
          revoked: false,
          expiresAt,
        },
      });
      // 💡 CONSOLE LOG: Refresh token saved
      console.log(`Refresh token (ID: ${jti}) saved successfully.`);

      return { accessToken, refreshToken };
    } catch (err) {
      this.logger.error(
        `Failed to generate tokens and store refresh for user ${userId}`,
        err.stack,
      );
      throw new InternalServerErrorException('Failed to generate authentication tokens');
    }
  }

  private parseDurationToMs(t: string) {
    if (!t) return 7 * 24 * 60 * 60 * 1000;
    const num = parseInt(t.replace(/\D/g, ''), 10);
    if (t.endsWith('d')) return num * 24 * 60 * 60 * 1000;
    if (t.endsWith('h')) return num * 60 * 60 * 1000;
    if (t.endsWith('m')) return num * 60 * 1000;
    if (t.endsWith('s')) return num * 1000;
    return num * 1000;
  }
}