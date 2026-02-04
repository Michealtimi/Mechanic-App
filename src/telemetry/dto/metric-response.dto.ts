import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricSource } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MetricResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  vehicleId: string;

  @Expose()
  @ApiPropertyOptional()
  batteryLevel?: number;

  @Expose()
  @ApiPropertyOptional()
  soc?: number;

  @Expose()
  @ApiPropertyOptional()
  rangeKm?: number;

  @Expose()
  @ApiProperty({ enum: MetricSource })
  source: MetricSource;

  @Expose()
  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @Expose()
  @ApiProperty()
  timestamp: Date;
}
