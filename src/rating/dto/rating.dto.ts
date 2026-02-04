/* eslint-disable prettier/prettier */
import { IsUUID, IsInt, Min, Max, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- 1. Create Rating DTO ---


export class CreateRatingDto {
  
  @ApiProperty({ 
    description: 'The unique ID of the completed Booking this rating applies to.', 
    example: 'b7c4a9d0-1e5f-4c8b-8a7e-1d2f3g4h5i6j' 
  })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ 
    description: 'The ID of the Mechanic being rated.', 
    example: 'm8e5c1b2-2f6g-4d9c-9b8f-2e3d4c5b6a7f' 
  })
  @IsUUID()
  @IsNotEmpty()
  mechanicId: string;

  @ApiProperty({ 
    description: 'The rating score given (1 to 5).', 
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsInt()
  @Min(1, { message: 'Score must be at least 1.' })
  @Max(5, { message: 'Score cannot exceed 5.' })
  @IsNotEmpty()
  score: number;

  @ApiPropertyOptional({ 
    description: 'Optional written review/comment.', 
    example: 'Excellent service, quick and professional!' 
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateRatingDto {
  @ApiPropertyOptional({ 
    description: 'The updated rating score (1 to 5).', 
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Score must be at least 1.' })
  @Max(5, { message: 'Score cannot exceed 5.' })
  score?: number;

  @ApiPropertyOptional({ 
    description: 'Optional updated written review/comment.', 
    example: 'The service was good, but the wait time was a bit long.' 
  })
  @IsOptional()
  @IsString()
  comment?: string;
}