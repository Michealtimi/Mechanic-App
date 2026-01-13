// src/users/dto/signup-mechanic.dto.ts
import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, IsBoolean, IsNumber, Min, Max, IsUrl, IsEmail, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client'; // Import Role enum


export class SignupMechanicDto extends CreateUserDto { // Extend CreateUserDto
  @IsString()
  @IsNotEmpty()
  shopName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsBoolean()
  isEvSpecialist?: boolean; // NEW: EV Specialist flag

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200) // Example max radius
  serviceRadiusKm?: number; // NEW: Service radius

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  currentLat?: number; // NEW: Current latitude

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  currentLng?: number; // NEW: Current longitude

  @IsOptional()
  @IsString()
  bio?: string; // NEW: Mechanic bio

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string; // NEW: Profile picture URL

  @IsOptional()
  @IsArray()
  @IsUrl({ each: true })
  certificationUrls?: string[]; // NEW: Array of certification URLs
}

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6) // Example minimum length
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

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
  @IsString() // Assuming push token is a string
  pushToken?: string;

  // If you still use fullName, keep it but consider removing in favor of firstName/lastName
  // @IsOptional()
  // @IsString()
  // fullName?: string;
}