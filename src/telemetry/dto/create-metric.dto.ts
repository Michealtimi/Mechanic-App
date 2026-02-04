import { IsString, IsEnum, IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricSource } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateMetricDto {
  @ApiProperty({
    description: 'Vehicle ID',
    example: 'vehicle-uuid-here',
  })
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({
    description: 'Battery level percentage (0-100)',
    example: 85.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  batteryLevel?: number;

  @ApiPropertyOptional({
    description: 'State of Charge (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  soc?: number;

  @ApiPropertyOptional({
    description: 'Estimated range in kilometers',
    example: 350.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  rangeKm?: number;

  @ApiPropertyOptional({
    description: 'Metric source',
    enum: MetricSource,
    default: MetricSource.MANUAL,
  })
  @IsEnum(MetricSource)
  @IsOptional()
  source?: MetricSource;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { temperature: 25, voltage: 400 },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
