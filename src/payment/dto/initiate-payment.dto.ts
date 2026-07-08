import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Amount in smallest currency unit (kobo/cents)' })
  @IsNotEmpty()
  amount: number | string;

  @ApiPropertyOptional({ default: 'PAYSTACK' })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code for gateway routing', example: 'NG' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'ISO 4217 currency', example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bookingSegmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mechanicSubaccount?: string;
}
