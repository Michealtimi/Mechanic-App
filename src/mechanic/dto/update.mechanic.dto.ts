import { PartialType } from '@nestjs/mapped-types';
import { CreateMechanicDto } from './mechanic.dto';


export class UpdateMechanicDto extends PartialType(CreateMechanicDto) {}
