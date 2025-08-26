/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { jwtSecret } from 'src/utils/constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Sign up method (supports both customer & mechanic)
   */
  async signup(dto: AuthDto, role: Role, status: 'ACTIVE' | 'PENDING' = 'ACTIVE') {
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
        data: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
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
      if (!foundUser || !foundUser.password) throw new UnauthorizedException('Invalid credentials');

      // 2️⃣ Compare password
      const isMatch = await this.comparePassword(password, foundUser.password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      // 3️⃣ Generate JWT
      const token = await this.signToken(foundUser);

      return {
        success: true,
        message: 'Login successful',
        token,
        user: plainToInstance(UserResponseDto, foundUser, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Signin failed. Please try again later.',
      );
    }
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
   * Sign JWT Token
   */
  private async signToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload, { secret: jwtSecret, expiresIn: '7d' });
  }
}
