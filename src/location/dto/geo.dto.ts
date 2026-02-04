// src/geo/dto/geo.dto.ts (New file for Geo-related DTOs)

import {
  IsNumber,
  IsNotEmpty,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { Role } from '@prisma/client'; // Assuming Role enum is from Prisma

// Re-using/redefining UpdateLocationDto here for clarity if it's not global
export class UpdateLocationDto {
  @ApiProperty({
    description: 'The latitude coordinate of the location',
    example: 34.052235,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty({ message: 'Latitude is required' })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @IsLatitude({ message: 'Invalid latitude value' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  lat: number;

  @ApiProperty({
    description: 'The longitude coordinate of the location',
    example: -118.243683,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty({ message: 'Longitude is required' })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @IsLongitude({ message: 'Invalid longitude value' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  lng: number;
}


// DTO for /geo/nearby query parameters
export class GetNearbyMechanicsDto {
  @ApiProperty({
    description: 'The latitude coordinate of the center point for the search',
    example: 34.052235,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty({ message: 'Latitude is required' })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @IsLatitude({ message: 'Invalid latitude value' })
  @Type(() => Number) // Ensure string query param is converted to number
  lat: number;

  @ApiProperty({
    description: 'The longitude coordinate of the center point for the search',
    example: -118.243683,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty({ message: 'Longitude is required' })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @IsLongitude({ message: 'Invalid longitude value' })
  @Type(() => Number) // Ensure string query param is converted to number
  lng: number;

  @ApiProperty({
    description: 'The search radius in kilometers',
    example: 20,
    default: 10,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Radius must be a number' })
  @Min(1, { message: 'Radius must be at least 1 km' })
  @Max(200, { message: 'Radius cannot exceed 200 km' }) // Example max radius
  @Type(() => Number) // Ensure string query param is converted to number
  radiusKm?: number = 10; // Default value
}


// Response DTO for Mechanic (potentially with distance)
export class MechanicGeoResponseDto {
  @Expose()
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  id: string;

  @Expose()
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @Expose()
  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @Expose()
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsString()
  email: string;

  @Expose()
  @ApiProperty({ enum: Role, example: Role.MECHANIC })
  role: Role;

  @Expose()
  @ApiProperty({ example: 34.052235, nullable: true })
  @IsOptional()
  lat?: number;

  @Expose()
  @ApiProperty({ example: -118.243683, nullable: true })
  @IsOptional()
  lng?: number;

  @Expose()
  @ApiProperty({ example: true })
  isEvSpecialist: boolean;

  @Expose()
  @ApiProperty({ example: 25 })
  serviceRadiusKm: number;

  @Expose()
  @ApiProperty({ example: 'Experienced EV mechanic.' })
  bio: string;

  @Expose()
  @ApiProperty({ example: ['Tesla', 'Porsche EV'] })
  specializations: string[];

  @Expose()
  @ApiProperty({ example: 'https://example.com/profile.jpg', nullable: true })
  profilePictureUrl?: string;

  // Add the distance property if it's part of the response from findNearby
  @Expose()
  @ApiProperty({
    description: 'Distance from the query point in kilometers',
    example: 5.23,
    type: 'number',
    required: false,
  })
  distance?: number;

  // You can include other properties like mechanicStatus, createdAt, updatedAt if needed
}