// src/users/users.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards, // Import UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupCustomerDto } from './dto/signup-customer.dto';
import { SignupMechanicDto } from './dto/signup-mechanic.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { Role } from '@prisma/client'; // Import Role enum
import { JwtAuthGuard } from 'src/auth/jwt.guard'; // Import JwtAuthGuard
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { GetUser } from 'src/utils/get-user.decorator';

@ApiTags('Users')
@Controller('users')
// Apply guards to all endpoints in this controller
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup-customer')
  @ApiOperation({ summary: 'Sign up as a customer (public)' })
  // No guards needed for public endpoints, but this is handled by the Public decorator
  signupCustomer(@Body() dto: SignupCustomerDto) {
    return this.usersService.signupCustomer(dto);
  }

  @Post('signup-mechanic')
  @ApiOperation({ summary: 'Sign up as a mechanic (public)' })
  signupMechanic(@Body() dto: SignupMechanicDto) {
    return this.usersService.signupMechanic(dto);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Restrict to ADMIN and SUPER_ADMIN
  @ApiOperation({ summary: 'Create a new user (Admin-only)' })
  createUser(
    @Body() dto: CreateUserDto,
    @GetUser('id') callerId: string,
    @GetUser('role') callerRole: Role,
  ) {
    return this.usersService.createUser(dto, callerId, callerRole);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get all users (paginated, Admin-only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetUser('role') callerRole: Role,
  ) {
    return this.usersService.getAllUsers(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Authenticated)' })
  // Allow ADMIN and SUPER_ADMIN to get any user, but a regular user can only get their own profile
  getUserById(
    @Param('id') id: string,
    @GetUser('id') callerId: string,
    @GetUser('role') callerRole: Role,
  ) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Authenticated)' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @GetUser('id') callerId: string,
    @GetUser('role') callerRole: Role,
  ) {
    return this.usersService.updateUser(id, dto, callerId, callerRole);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN) // Only SUPER_ADMIN can soft delete users
  @ApiOperation({ summary: 'Soft delete user (SUPER_ADMIN only)' })
  deleteUser(
    @Param('id') id: string,
    @GetUser('id') callerId: string,
    @GetUser('role') callerRole: Role,
  ) {
    return this.usersService.deleteUser(id, callerId, callerRole);
  }
}