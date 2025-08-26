/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ example: 'uuid-of-service', description: 'Unique ID of the service' })
  id: string;

  @ApiProperty({ example: 'Oil Change', description: 'Service title' })
  title: string;

  @ApiPropertyOptional({ example: 'Complete engine oil replacement', description: 'Detailed service description' })
  description?: string | null;

  @ApiProperty({ example: 5000, description: 'Price of the service' })
  price: number;

  @ApiPropertyOptional({ example: '2 hours', description: 'Estimated completion time' })
  estimatedTime?: string | null;

  @ApiPropertyOptional({ example: 'Weekdays only', description: 'Availability of the service' })
  availability?: string | null;

  @ApiProperty({ example: 'uuid-of-mechanic', description: 'Mechanic ID offering this service' })
  mechanicId: string;

  @ApiProperty({ example: new Date().toISOString(), description: 'Date the service was created' })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString(), description: 'Date the service was last updated' })
  updatedAt: Date;
}
