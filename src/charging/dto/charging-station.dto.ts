import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindChargingStationsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radiusKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  connectorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  available?: boolean;
}

export class ChargingStationConnectorDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  powerKw: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  status: string;
}

export class ChargingStationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  address: string;

  @ApiProperty({ type: [ChargingStationConnectorDto] })
  connectors: ChargingStationConnectorDto[];

  @ApiProperty()
  distanceKm: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  provider: string;
}
