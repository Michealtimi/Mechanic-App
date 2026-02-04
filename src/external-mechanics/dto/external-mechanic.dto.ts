import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterExternalMechanicDto {
  @ApiProperty({ description: 'Email address', example: 'mechanic@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password', example: 'SecurePassword123!' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Phone number', example: '+2348012345678' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Shop name', example: 'John\'s Auto Repair' })
  @IsString()
  shopName: string;

  @ApiPropertyOptional({ description: 'Service radius in km', example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ description: 'Is EV specialist', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isEvSpecialist?: boolean;
}

export class VerifyExternalMechanicDto {
  @ApiProperty({ description: 'Verification status', enum: ['VERIFIED', 'REJECTED'] })
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Rejection reason (required if status is REJECTED)' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ExternalMechanicResponseDto {
  @ApiProperty({ description: 'Mechanic ID' })
  id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Is external mechanic' })
  isExternal: boolean;

  @ApiProperty({ description: 'Verification status', enum: ['VERIFIED', 'PENDING', 'REJECTED'] })
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';

  @ApiProperty({ description: 'Commission rate (%)' })
  commissionRate: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
