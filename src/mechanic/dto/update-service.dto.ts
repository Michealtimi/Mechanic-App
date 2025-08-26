/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateMechanicServiceDto } from './create-mechanic-service.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateMechanicServiceDto) {
  @ApiProperty({ example: 'uuid-of-service', description: 'The ID of the service being updated' })
  @IsString()
  @IsNotEmpty()
  id: string;
}
