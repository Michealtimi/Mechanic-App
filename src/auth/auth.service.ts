/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { Role, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { ConfigService } from '@nestjs/config'; // ✅ ADDED: for env-based config
import { v4 as uuidv4 } from 'uuid'; // ✅ ADDED: for refresh token IDs

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService, // ✅ ADDED: inject ConfigService
  ) {}

  /**
   * Sign up method (supports customer, mechanic, admin, super admin)
   */
  async signup(
    dto: AuthDto,
    role: Role,
    status: 'ACTIVE' | 'PENDING' = 'ACTIVE',
  ) {
    try {
      const { email, password } = dto;

      // 1️⃣ Check if email already exists
      const foundUser = await this.prisma.user.findUnique({ where: { email } });
      if (foundUser) throw new BadRequestException('Email already exists');

      // 2️⃣ Hash password
      const hashedPassword = await this.hashPassword(password);

      // 3️⃣ Create new user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          status,
        },
      });

      // 4️⃣ Return safe user response
      return {
        success: true,
        message: `${role} signup successful`,
        data: plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Signup failed. Please try again later.',
      );
    }
  }

  /**
   * Sign in a user
   */
  async signin(dto: AuthDto) {
    try {
      const { email, password } = dto;

      // 1️⃣ Find user
      const foundUser = await this.prisma.user.findUnique({ where: { email } });
      if (!foundUser || !foundUser.password)
        throw new UnauthorizedException('Invalid credentials');

      // 2️⃣ Compare password
      const isMatch = await this.comparePassword(password, foundUser.password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      // 3️⃣ Generate JWT (access + refresh tokens) ✅ CHANGED: added refresh token flow
      const tokens = await this.getTokensAndStoreRefresh(foundUser);

      // 4️⃣ Update last login ✅ ADDED
      await this.prisma.user.update({
        where: { id: foundUser.id },
        data: { lastLogin: new Date() },
      });

      return {
        success: true,
        message: 'Login successful',
        ...tokens,
        user: plainToInstance(UserResponseDto, foundUser, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Signin failed. Please try again later.',
      );
    }
  }

  /**
   * Logout user ✅ ADDED
   */
  async logout(refreshToken: string) {
    try {
      const payload: any = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const jti = payload.jti;
      await this.prisma.refreshToken.update({
        where: { id: jti },
        data: { revoked: true },
      });

      return { message: 'Logged out' };
    } catch {
      return { message: 'Logged out' };
    }
  }

  /**
   * Refresh access token ✅ ADDED
   */
  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    if (!stored || stored.revoked)
      throw new ForbiddenException('Refresh token revoked');

    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });
      throw new ForbiddenException('Refresh token expired');
    }

    const isMatch = await bcrypt.compare(refreshToken, stored.token);
    if (!isMatch) throw new ForbiddenException('Invalid refresh token');

    // revoke old token and issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new ForbiddenException('User not found');

    return this.getTokensAndStoreRefresh(user);
  }

  /**
   * Forgot password ✅ ADDED
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      return { message: 'If an account exists, a reset link was sent.' };

    const resetToken = await this.jwt.signAsync(
      { sub: user.id },
      { secret: this.config.get<string>('JWT_RESET_SECRET'), expiresIn: '1h' },
    );

    // TODO: send email with resetToken link
    return {
      message: 'If an account exists, a reset link was sent.',
      token: resetToken,
    };
  }

  /**
   * Reset password ✅ ADDED
   */
  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_RESET_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Invalid or expired reset token');
    }

    const hashed = await this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashed },
    });

    return { message: 'Password reset successful' };
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare password
   */
  private async comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Sign JWT + Refresh token ✅ CHANGED: now issues both
   */
  private async getTokensAndStoreRefresh(user: User) {
    const jti = uuidv4();

    const accessPayload = { sub: user.id, email: user.email, role: user.role };
    const refreshPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
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
        userId: user.id,
        revoked: false,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private parseDurationToMs(t: string) {
    const num = parseInt(t.replace(/\D/g, ''), 10);
    if (t.endsWith('d')) return num * 24 * 60 * 60 * 1000;
    if (t.endsWith('h')) return num * 60 * 60 * 1000;
    if (t.endsWith('m')) return num * 60 * 1000;
    if (t.endsWith('s')) return num * 1000;
    return num * 1000;
  }
}
