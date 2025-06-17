import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ example: 'uuid-of-service', description: 'Unique ID of the service' })
  id: string;

  @ApiProperty({ example: 'Oil Change', description: 'Title of the mechanic service' })
  title: string;

  @ApiPropertyOptional({ example: 'Complete engine oil replacement', description: 'Detailed description of the service' })
  description?: string | null;

  @ApiProperty({ example: 5000, description: 'Price in Naira or preferred currency' })
  price: number;

  @ApiPropertyOptional({ example: '2 hours', description: 'Estimated time to complete the service' })
  estimatedTime?: string | null;

  @ApiPropertyOptional({ example: 'Weekdays only', description: 'Mechanic availability for this service' })
  availability?: string | null;

  @ApiProperty({ example: 'uuid-of-mechanic', description: 'ID of the mechanic offering this service' })
  mechanicId: string;

  @ApiProperty({ example: new Date().toISOString(), description: 'Date the service was created' })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString(), description: 'Date the service was last updated' })
  updatedAt: Date;
}
