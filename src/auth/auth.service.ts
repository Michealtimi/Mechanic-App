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
  MechanicStatus, // Import MechanicStatus enum
} from './dto/auth.dto';

import { Role, } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
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
   * Handles mechanic-specific fields if the role is MECHANIC.
   */
  async register(dto: RegisterUserDto) {
    try {
      this.logger.log(`Attempting registration for email: ${dto.email}, role: ${dto.role}`);

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

      // Prepare common user data
      const userData: any = {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role, // Prisma should automatically cast from string to enum if type matches
      };

      // Handle mechanic-specific fields
      if (dto.role === Role.MECHANIC) {
        userData.isEvSpecialist = dto.isEvSpecialist ?? false; // Default to false if not provided
        userData.serviceRadiusKm = dto.serviceRadiusKm ?? 0;   // Default to 0 if not provided
        userData.bio = dto.bio ?? '';                         // Default to empty string
        userData.specializations = dto.specializations ?? []; // Default to empty array
        userData.profilePictureUrl = dto.profilePictureUrl ?? null; // Default to null
        // Initial status for a MECHANIC, defaults to PENDING if not explicitly set
        userData.mechanicStatus = dto.status ?? MechanicStatus.PENDING;
      }

      const user = await this.prisma.user.create({
        data: userData,
      });

      // Email sending logic (unchanged)
      try {
        const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        await this.mailService.sendWelcomeEmail(user.email, {
          name: userName,
          role: user.role,
        });
        this.logger.log(`Welcome email successfully queued for ${user.email}`);
      } catch (err) {
        this.logger.warn(
          `Welcome email failed for ${user.email}. Error: ${
            (err as any).message || err
          }`,
        );
      }

      this.logger.log(`User registered successfully with ID: ${user.id} and role: ${user.role}`);
      const { password, ...rest } = user; // Exclude password from the response
      return plainToInstance(UserResponseDto, rest, { excludeExtraneousValues: true });
    } catch (err) {
      this.logger.error(`Failed to register user ${dto.email}`, err.stack);
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /* ----------------- LOGIN ----------------- */
  /**
   * Authenticate a user, generate JWTs, and update lastLogin timestamp.
   */
  async login(dto: LoginDto) {
    try {
      this.logger.log(`Attempting login for email: ${dto.email}`);

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

      // Update lastLogin timestamp
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      this.logger.log(`User logged in and lastLogin updated for ID: ${user.id}`);
      this.logger.log(`Login successful for user ID: ${user.id}`);

      // Use the updatedUser for the response to reflect lastLogin change
      return {
        success: true,
        message: 'Login successful',
        user: plainToInstance(UserResponseDto, updatedUser, {
          excludeExtraneousValues: true,
        }),
        ...tokens,
      };
    } catch (err) {
      this.logger.error(`Failed to log in user ${dto.email}`, err.stack);
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  /* ----------------- LOGOUT ----------------- */
  // (No changes needed)
  async logout(refreshToken: string) {
    this.logger.log('Logout initiated.');
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
      this.logger.log(`Token ${jti} revoked.`);

      return { message: 'Logged out' };
    } catch (err) {
      this.logger.error(`Failed to logout (revoke token)`, err.stack);
      if (err instanceof BadRequestException || err instanceof ForbiddenException) {
        throw err;
      }
      return { message: 'Logged out' }; // Fail-safe: return success to prevent attacker knowledge on token validity
    }
  }

  /* ----------------- REFRESH ----------------- */
  // (No changes needed)
  async refreshToken(refreshToken: string) {
    this.logger.log('Token refresh request started.');
    try {
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
      this.logger.log(`Processing refresh for user ${userId} and token ID ${jti}`);

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
      this.logger.log(`Successfully issued new tokens for user ${user.id}`);
      return newTokens;
    } catch (err) {
      this.logger.error(`Failed to refresh token`, err.stack);
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Token refresh failed');
    }
  }

  /* ----------------- FORGOT PASSWORD ----------------- */
  // (No changes needed, already designed for graceful failure)
  async forgotPassword(dto: ForgotPasswordDto) {
    this.logger.log(`Password reset requested for email: ${dto.email}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

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
      return { message: 'If an account exists, a reset link was sent.' };
    } catch (err) {
      this.logger.error(`Failed to process forgot password for ${dto.email}`, err.stack);
      throw new InternalServerErrorException('Failed to process password reset');
    }
  }

  /* ----------------- RESET PASSWORD ----------------- */
  // (No changes needed)
  async resetPassword(dto: ResetPasswordDto) {
    this.logger.log('Password reset request with token received.');
    try {
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
      this.logger.log(`Processing password reset for user ID: ${userId}`);

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
      return { message: 'Password reset successful' };
    } catch (err) {
      this.logger.error(`Failed to reset password for token`, err.stack);
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
    this.logger.log(`Generating tokens and storing refresh for user ${userId}`);
    try {
      const jti = uuidv4();
      const accessPayload = { sub: userId, email, role: role as string };
      const refreshPayload = { sub: userId, email, role: role as string, jti };

      const accessToken = await this.jwtService.signAsync({ ...accessPayload }, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m',
      });

      const refreshToken = await this.jwtService.signAsync({ ...refreshPayload }, {
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
      this.logger.log(`Refresh token (ID: ${jti}) saved successfully.`);

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