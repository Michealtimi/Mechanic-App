import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatemechanicService {
  @ApiProperty({ example: 'Oil Change', description: 'Title of the service' })  // used in DTO to document input and output
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Change engine oil and filter', description: 'Detailed description of the service' }) ///marks the property as optional in the generated Swagger docs.
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ example: 49.99, description: 'Price of the service in USD' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: '1 hour', description: 'Estimated time to complete the service' })
  @IsOptional()
  @IsString()
  estimatedTime: string;

  @ApiPropertyOptional({ example: 'Mon-Fri 9am-5pm', description: 'Mechanic availability for the service' })
  @IsOptional()
  @IsString()
  availability: string;
}

/**
 * @ApiProperty() is used to document required properties in Swagger.
 * @ApiPropertyOptional() is used to document optional properties in Swagger.
 * 
 * - @ApiProperty() marks the property as required in the generated Swagger docs.
 * - @ApiPropertyOptional() marks the property as optional in the generated Swagger docs.
 * 
 * Passing 0 to @ApiProperty() (i.e., @ApiProperty(0)) is not correct usage and will likely cause an error.
 */