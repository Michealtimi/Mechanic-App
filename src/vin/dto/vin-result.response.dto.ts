import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VinResultResponseDto {
  @ApiProperty({ description: 'Short ID for shareable URL' })
  shortId: string;

  @ApiProperty({ description: 'Redirect URL to result page' })
  redirectUrl: string;
}

export class VinResultPayloadDto {
  @ApiProperty({ description: 'VIN decoded' })
  vin: string;

  @ApiPropertyOptional({ description: 'Make (e.g. Honda)' })
  make?: string;

  @ApiPropertyOptional({ description: 'Model (e.g. Accord)' })
  model?: string;

  @ApiPropertyOptional({ description: 'Model year' })
  year?: number;

  @ApiPropertyOptional({ description: 'Body class (e.g. Sedan/Sedan)' })
  bodyClass?: string;

  @ApiPropertyOptional({ description: 'Engine model' })
  engine?: string;

  @ApiPropertyOptional({ description: 'Plant city' })
  plantCity?: string;

  @ApiPropertyOptional({ description: 'Plant country' })
  plantCountry?: string;

  @ApiPropertyOptional({ description: 'Manufacturer' })
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Vehicle type' })
  vehicleType?: string;
}
