/* eslint-disable prettier/prettier */
import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SignupMechanicDto {
  @ApiProperty({ example: 'mike.mechanic@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Mike Garage' })
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiPropertyOptional({ example: ['engine', 'brakes'] })
  @IsOptional()
  @IsArray()
  skills?: string[];
}
