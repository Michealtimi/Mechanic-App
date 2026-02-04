/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsArray, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {Type, Transform } from 'class-transformer';

export class CreateMechanicDto {
  @ApiProperty({ example: 'mechanic@example.com', description: 'Email of the mechanic' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Segun', description: 'FirstName of the mechanic' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Farmer', description: 'LastName of the mechanic' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'securePassword123', description: 'Password for the mechanic account' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'SpeedyFix Auto Repair', description: 'Name of the shop' })
  @IsNotEmpty()
  @IsString()
  shopName: string;

  @ApiProperty({ example: 'Accra, Ghana', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: ['Brake systems', 'Engine diagnostics'], description: 'Skills of the mechanic' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value];
    return undefined;
  })
  skills?: string[];

  @ApiProperty({ example: 5, description: 'Years of experience', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  experienceYears?: number;

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiProperty({ example: 'Expert in Japanese cars', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}
