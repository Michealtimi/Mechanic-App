import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMechanicServiceDto {
  @ApiProperty({ example: 'Oil Change', description: 'Title of the service' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Change engine oil and filter',
    description: 'Detailed description of the service',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 49.99, description: 'Price of the service in USD' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: '1 hour',
    description: 'Estimated time to complete the service',
  })
  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @ApiPropertyOptional({
    example: 'Mon-Fri 9am-5pm',
    description: 'Mechanic availability for the service',
  })
  @IsOptional()
  @IsString()
  availability?: string;
}
