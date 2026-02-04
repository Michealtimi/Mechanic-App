import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MetricSource } from '@prisma/client';
import { Type } from 'class-transformer';

export class MetricFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering metrics',
    example: '2026-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering metrics',
    example: '2026-01-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by metric source',
    enum: MetricSource,
  })
  @IsEnum(MetricSource)
  @IsOptional()
  source?: MetricSource;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of records to take',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  take?: number = 50;
}
