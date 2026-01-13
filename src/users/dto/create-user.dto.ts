// src/users/dto/signup-mechanic.dto.ts
import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, IsBoolean, IsNumber, Min, Max, IsUrl, IsEmail, MinLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, Status } from '@prisma/client'; // Import Role enum





export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  pushToken?: string;

  @IsOptional()
  @IsEnum(Status) // Admin can update user status (e.g., PENDING -> APPROVED)
  status?: Status;

  @IsOptional()
  @IsEnum(Role) // Admin might change roles, but handle with care in service logic
  role?: Role;

  @IsOptional()
  @IsString()
  bio?: string; // Common bio field

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string; // Common profile picture URL

  @IsOptional()
  @IsString({ each: true })
  @IsUrl({ each: true })
  certificationUrls?: string[];
}