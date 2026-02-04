import { IsString, IsEnum, IsOptional, IsNumber, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Organization ID that owns this vehicle',
    example: 'org-uuid-here',
  })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({
    description: 'Vehicle Identification Number (VIN)',
    example: '1HGBH41JXMN109186',
  })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiProperty({
    description: 'Vehicle type (EV or ICE)',
    enum: VehicleType,
    example: VehicleType.EV,
  })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiPropertyOptional({
    description: 'Vehicle make',
    example: 'Tesla',
  })
  @IsString()
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({
    description: 'Vehicle model',
    example: 'Model 3',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'Vehicle year',
    example: 2023,
    minimum: 1900,
    maximum: 2100,
  })
  @IsNumber()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Telematics data (JSON)',
    example: { batteryLevel: 85, soc: 0.85, rangeKm: 350 },
  })
  @IsObject()
  @IsOptional()
  telematics?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Vehicle latitude',
    example: 6.5244,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Vehicle longitude',
    example: 3.3792,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lng?: number;
}
