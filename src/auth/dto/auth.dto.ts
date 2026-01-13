// src/auth/dto/auth.dto.ts

import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Role } from '@prisma/client'; // Assuming Role enum is from Prisma

// --- Register DTO ---
export enum MechanicStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class RegisterUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Minimum 8 characters' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.CUSTOMER, description: 'User role' })
  @IsEnum(Role)
  role: Role;

  // --- Mechanic-specific fields (optional for non-mechanics) ---
  @ApiProperty({
    example: true,
    required: false,
    description: 'Is the mechanic an EV specialist?',
  })
  @IsOptional()
  @IsBoolean()
  isEvSpecialist?: boolean;

  @ApiProperty({
    example: 25,
    required: false,
    description: 'Service radius in kilometers',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200) // Example max radius
  serviceRadiusKm?: number;

  @ApiProperty({
    example: 'Experienced mechanic specializing in European cars.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;

  @ApiProperty({
    example: ['Toyota', 'Honda'],
    required: false,
    description: 'List of car brands the mechanic specializes in',
  })
  @IsOptional()
  @IsString({ each: true })
  specializations?: string[];

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    required: false,
    description: "URL to the mechanic's profile picture",
  })
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string; // Consider renaming for general user profile picture

  @ApiProperty({
    enum: MechanicStatus,
    example: MechanicStatus.PENDING,
    required: false,
    description: 'Initial status for a mechanic (defaults to PENDING)',
  })
  @IsOptional()
  @IsEnum(MechanicStatus)
  status?: MechanicStatus;
}

// --- Other DTOs (no changes needed) ---
export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'JWT reset token from email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'Minimum 8 characters' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

// UserResponseDto from users/dto/createmechanic.dto can be used as is,
// or you might want to move it to a shared `users/dto/user-response.dto.ts`
// if it's used broadly by auth and users modules.
// For now, let's assume it's appropriate from `createmechanic.dto` if that file defines a general UserResponseDto.