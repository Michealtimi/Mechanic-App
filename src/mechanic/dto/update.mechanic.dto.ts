/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
 
import { PartialType } from '@nestjs/mapped-types';
import { CreateMechanicDto } from './create-mechanic.dto';
import { Transform } from 'class-transformer';

export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value];
    return undefined;
  })
  skills?: string[];
}
