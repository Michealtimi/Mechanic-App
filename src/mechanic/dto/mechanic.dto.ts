// mechanic/dto/create-mechanic.dto.ts

import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMechanicDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username for the mechanic' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'johndoe@gmail.com', description: 'Email address of the mechanic' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'SpeedyFix Auto Repair' })
  @IsString()
  shopName: string;

  @ApiProperty({ example: 'Accra, Ghana', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'Brake systems, Engine diagnostics', required: false })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiProperty({ example: '5', description: 'Years of experience', required: false })
  @IsOptional()
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
