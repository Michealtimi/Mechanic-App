import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CreateMechanicDto } from 'src/mechanic/dto/mechanic.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get current authenticated user
  async getMyUser(id: string, req: Request) {
    const user: User | null = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const decodedUser = req.user as { id: string; email: string };

    if (user.id !== decodedUser.id) {
      throw new ForbiddenException('You are not authorized to access this resource');
    }

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  // Register a new mechanic
  async createMechanic(dto: CreateMechanicDto) {
    const hashedPassword = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: 'MECHANIC',
        shopName: dto.shopName,
        location: dto.location,
        skills: Array.isArray(dto.skills)
        ? dto.skills.filter((skill): skill is string => typeof skill === 'string')
        : typeof dto.skills === 'string'
        ? [dto.skills]
        : []
      },
    });

    const { password, ...rest } = user;
    return rest;
  }

  // Get a list of users (light version)
  async getUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });
  }

  // Utility: Hash password using bcrypt
  private async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(password, saltOrRounds);
  }
}
