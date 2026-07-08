import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, VehicleStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VehicleResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  orgId: string;

  @Expose()
  @ApiPropertyOptional()
  vin?: string;

  @Expose()
  @ApiProperty({ enum: VehicleType })
  type: VehicleType;

  @Expose()
  @ApiPropertyOptional()
  make?: string;

  @Expose()
  @ApiPropertyOptional()
  model?: string;

  @Expose()
  @ApiPropertyOptional()
  year?: number;

  @Expose()
  @ApiPropertyOptional()
  telematics?: Record<string, any>;

  @Expose()
  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @Expose()
  @ApiPropertyOptional()
  lat?: number;

  @Expose()
  @ApiPropertyOptional()
  lng?: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
