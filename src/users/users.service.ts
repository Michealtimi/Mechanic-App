import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role, User } from '@prisma/client';
import { CreateMechanicDto } from 'src/mechanic/dto/mechanic.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get current authenticated user
  async getMyUser(id: string, req: Request) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const decodedUser = req.user as { id?: string; email?: string };
      if (!decodedUser?.id || user.id !== decodedUser.id) {
        throw new ForbiddenException('You are not authorized to access this resource');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;

    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Register a new mechanic
  async createMechanic(dto: CreateMechanicDto) {
    try {
      const hashedPassword = await this.hashPassword(dto.password);
      const skills = this.normalizeSkills(dto.skills);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: Role.MECHANIC,
          shopName: dto.shopName,
          location: dto.location,
          skills,
        },
      });

      const { password, ...rest } = user;
      return rest;

    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Get a list of users (light version)
  async getUsers() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Create user with role
  async createUserWithRole(dto: CreateUserDto) {
    try {
      const hashedPassword = await this.hashPassword(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: dto.role ?? Role.CUSTOMER,
        },
      });

      const { password, ...rest } = user;
      return rest;

    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Utility: Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Utility: Normalize skills input
  private normalizeSkills(input: any): string[] {
    if (Array.isArray(input)) {
      return input.filter((skill): skill is string => typeof skill === 'string');
    }
    return typeof input === 'string' ? [input] : [];
  }
}
