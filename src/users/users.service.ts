/* eslint-disable prettier/prettier */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';

import { plainToInstance } from 'class-transformer';

import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Customer signup
   */
  async signupCustomer(dto: SignupCustomerDto) {
    try {
      // formatting email
      const email = dto.email.toLowerCase();

      // check if  email already exit
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new BadRequestException('Email already exists');

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.CUSTOMER,
        },
      });

      return {
        success: true,
        message: 'Customer signup successful',
        data: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Customer signup failed');
    }
  }

  /**
   * Mechanic signup
   */
  async signupMechanic(dto: SignupMechanicDto) {
    try {
    // email formatting
      const email = dto.email.toLowerCase();

      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new BadRequestException('Email already exists');

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const skills = Array.isArray(dto.skills) ? dto.skills.filter(s => typeof s === 'string') : [];

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.MECHANIC,
          shopName: dto.shopName,
          skills,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        message: 'Mechanic signup successful',
        data: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Mechanic signup failed');
    }
  }

  /**
   * Create user (admin use) this is only for the admin
   */
  async createUser(dto: CreateUserDto) {
    try {
      const email = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new BadRequestException('Email already exists');

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const role = (dto.role as Role) ?? Role.CUSTOMER;

      const user = await this.prisma.user.create({
        data: { email, password: hashedPassword, role },
      });

      return {
        success: true,
        message: 'User created',
        data: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Create user failed');
    }
  }

  /**
   * Get all users (paginated)
   */
  async getAllUsers(page = 1, limit = 10) {
    try {
      const take = Math.max(1, limit);
      const skip = Math.max(0, (page - 1) * take);
      const where = { deletedAt: null };

      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({ where, take, skip }),
        this.prisma.user.count({ where }),
      ]);

      if (!users.length) {
        throw new NotFoundException('No users found');
      }

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true }),
          pagination: {
            page,
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
          },
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error fetching users');
    }
  }

  /**
   * Get single user by ID
   */
  async getUserById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      return {
        success: true,
        message: 'User retrieved',
        data: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error fetching user');
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, dto: UpdateUserDto) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('User not found');

      const updateData: any = {
        ...dto,
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.fullName && { fullName: dto.fullName.toUpperCase() }),
      };

      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, 10);
      }

      const updated = await this.prisma.user.update({ where: { id }, data: updateData });

      return {
        success: true,
        message: 'User updated successfully',
        data: plainToInstance(UserResponseDto, updated, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error updating user');
    }
  }

  /**
   * Soft delete
   */
  async deleteUser(id: string) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('User not found');

      const deleted = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        success: true,
        message: 'User deleted successfully',
        data: plainToInstance(UserResponseDto, deleted, { excludeExtraneousValues: true }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error deleting user');
    }
  }
}
