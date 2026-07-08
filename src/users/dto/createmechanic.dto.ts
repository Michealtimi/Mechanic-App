// src/users/dto/signup-mechanic.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsEmail,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class SignupMechanicDto extends CreateUserDto {
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
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  certificationUrls?: string[];
}
