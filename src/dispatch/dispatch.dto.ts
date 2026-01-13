/* eslint-disable prettier/prettier */
import {
  IsUUID,
  IsOptional,
  IsString,
  IsISO8601,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for initiating a Mechanic Dispatch.
 * This DTO is used to either manually dispatch a booking or provide
 * the necessary coordinates/address for the auto-matching/dispatch system.
 */
export class CreateDispatchDto {
  @ApiProperty({ description: 'ID of the Booking to be dispatched', example: 'uuid-booking-id' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({
    description: 'ID of the specific Mechanic chosen for this dispatch (required for manual assignment).',
    example: 'uuid-mechanic-id',
  })
  @IsOptional()
  @IsUUID()
  mechanicId?: string; // Optional: If empty, dispatch service will auto-assign based on location.

  @ApiPropertyOptional({
    description: 'ISO datetime when this assignment offer expires for the mechanic (used in bidding/assignment flows).',
    example: new Date(Date.now() + 3600000).toISOString(),
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  ---

  // === LOCATION DATA (Required for automatic dispatch) ===
  // Note: These fields should ideally be fetched from the associated Booking 
  // if the Booking object contains them. If this DTO is used to *override*
  // or *provide* initial location data when a Booking lacks it, they are required here.

  @ApiPropertyOptional({
    example: '34.0522',
    description: 'Latitude of the service/pickup location (as string for Decimal).',
  })
  @IsOptional()
  @IsString()
  pickupLatitude?: string;

  @ApiPropertyOptional({
    example: '-118.2437',
    description: 'Longitude of the service/pickup location (as string for Decimal).',
  })
  @IsOptional()
  @IsString()
  pickupLongitude?: string;

  @ApiPropertyOptional({
    example: '123 Main St, Anytown, USA',
    description: 'Human-readable address of the service/pickup location.',
  })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional({
    example: 'Vehicle is parked in the alley behind the building.',
    description: 'Optional additional notes about the exact location.',
  })
  @IsOptional()
  @IsString()
  pickupLocationNotes?: string;
  
  // ======================================================
}