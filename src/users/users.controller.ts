// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  SignupMechanicDto, // Specific DTO for mechanic signup
  UpdateUserDto,
  UserResponseDto, // Consolidated response DTO
  MechanicResponseDto, // If you want a distinct mechanic response
  UserFilterDto, // DTO for filtering users
} from './dto/user.dto'; // Import from the consolidated DTO file
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
@UseInterceptors(ClassSerializerInterceptor) // Apply serializer globally to this controller
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ======================
  // General User Creation (e.g., by admin or generic customer signup)
  // This would typically be a public endpoint in an auth module,
  // but if an admin creates users, it could be here.
  // ======================
  @Post()
  @Roles(Role.ADMIN) // Example: Only admins can create general users
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  // ======================
  // Mechanic Signup (Public endpoint, usually in Auth module)
  // ======================
  @Post('signup/mechanic')
  @HttpCode(HttpStatus.CREATED)
  // No @Roles guard here as this is a signup endpoint for new mechanics
  async signupMechanic(@Body() signupMechanicDto: SignupMechanicDto) {
    // Ensure the role is explicitly set to MECHANIC to prevent role elevation
    signupMechanicDto.role = Role.MECHANIC;
    const user = await this.usersService.signupMechanic(signupMechanicDto); // You'd have a specific service method for this
    return plainToInstance(MechanicResponseDto, user, { excludeExtraneousValues: true }); // Return MechanicResponseDto
  }

  // ======================
  // Get all users (e.g., for admin dashboard)
  // ======================
  @Get()
  @Roles(Role.ADMIN) // Only admins can view all users
  async findAll(@Query() filterDto: UserFilterDto) {
    const { data, meta } = await this.usersService.findAll(filterDto);
    return {
      data: plainToInstance(UserResponseDto, data, { excludeExtraneousValues: true }),
      meta,
    };
  }

  // ======================
  // Get a single user by ID
  // ======================
  @Get(':id')
  // Allow users to get their own profile, or admins to get any profile
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.MECHANIC)
  async findOne(@Param('id') id: string, @Req() req) {
    // Authorization logic in service: user can only view their own profile unless they are an admin
    const user = await this.usersService.findOne(id, req.user.id, req.user.role);
    // Determine which DTO to use based on the user's role
    const ResponseDto = user.role === Role.MECHANIC ? MechanicResponseDto : UserResponseDto;
    return plainToInstance(ResponseDto, user, { excludeExtraneousValues: true });
  }

  // ======================
  // Update a user's profile
  // ======================
  @Put(':id')
  // Allow users to update their own profile, or admins to update any profile
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.MECHANIC)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    // Authorization logic in service: user can only update their own profile unless they are an admin
    const updatedUser = await this.usersService.update(id, updateUserDto, req.user.id, req.user.role);
    const ResponseDto = updatedUser.role === Role.MECHANIC ? MechanicResponseDto : UserResponseDto;
    return plainToInstance(ResponseDto, updatedUser, { excludeExtraneousValues: true });
  }

  // ======================
  // Delete a user (typically admin-only)
  // ======================
  @Delete(':id')
  @Roles(Role.ADMIN) // Only admins can delete users
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }

  // ======================
  // Mechanic-specific endpoint: Update availability
  // ======================
  @Put(':id/availability')
  @Roles(Role.MECHANIC)
  async updateMechanicAvailability(@Param('id') id: string, @Body('isAvailableForJobs') isAvailableForJobs: boolean, @Req() req) {
    // Ensure the mechanic is updating their own status
    if (id !== req.user.id) {
      throw new ForbiddenException('You can only update your own availability.');
    }
    const updatedMechanic = await this.usersService.updateMechanicAvailability(id, isAvailableForJobs);
    return plainToInstance(MechanicResponseDto, updatedMechanic, { excludeExtraneousValues: true });
  }

    // ======================
    // Mechanic-specific endpoint: Update online status
    // ======================
    @Put(':id/online-status')
    @Roles(Role.MECHANIC)
    async updateMechanicOnlineStatus(@Param('id') id: string, @Body('status') status: string, @Req() req) {
        if (id !== req.user.id) {
            throw new ForbiddenException('You can only update your own online status.');
        }
        const updatedMechanic = await this.usersService.updateMechanicOnlineStatus(id, status);
        return plainToInstance(MechanicResponseDto, updatedMechanic, { excludeExtraneousValues: true });
    }
}