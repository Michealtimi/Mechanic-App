// src/users/dto/create-user.dto.ts
import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, Min, Max, IsUrl, IsEmail, MinLength, IsEnum } from 'class-validator';
import { Role, Status, MechanicOnlineStatus } from '@prisma/client';





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

/** Mechanic-specific profile update (extends UpdateUserDto fields) */
export class MechanicUpdateProfileDto extends UpdateUserDto {
  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsBoolean()
  isEvSpecialist?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  serviceRadiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  currentLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  currentLng?: number;

  @IsOptional()
  @IsBoolean()
  isAvailableForJobs?: boolean;

  @IsOptional()
  @IsEnum(MechanicOnlineStatus)
  mechanicOnlineStatus?: MechanicOnlineStatus;

  @IsOptional()
  @IsString({ each: true })
  skills?: string[];
}