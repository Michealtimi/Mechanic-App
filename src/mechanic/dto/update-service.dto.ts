import { PartialType } from '@nestjs/mapped-types';
import { CreatemechanicService } from './create-mechanic-service.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceDto extends PartialType(CreatemechanicService) {
  @ApiProperty({ example: 'uuid-of-service', description: 'The ID of the service being updated' })
  id: string;
}
