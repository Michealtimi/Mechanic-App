/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/customer')
  @ApiOperation({ summary: 'Sign up as a customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  async signupCustomer(@Body(ValidationPipe) dto: AuthDto) {
    return this.authService.signup(dto, Role.CUSTOMER, 'ACTIVE');
  }

  @Post('signup/mechanic')
  @ApiOperation({ summary: 'Sign up as a mechanic (pending approval)' })
  @ApiResponse({ status: 201, description: 'Mechanic created' })
  async signupMechanic(@Body(ValidationPipe) dto: AuthDto) {
    return this.authService.signup(dto, Role.MECHANIC, 'PENDING');
  }

  @Post('signin')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async signin(@Body(ValidationPipe) dto: AuthDto) {
    return this.authService.signin(dto);
  }

  // Example: Only admins can create other admins
  @Post('signup/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Sign up an admin (admin only)' })
  async signupAdmin(@Body(ValidationPipe) dto: AuthDto) {
    return this.authService.signup(dto, Role.ADMIN, 'ACTIVE');
  }
}
