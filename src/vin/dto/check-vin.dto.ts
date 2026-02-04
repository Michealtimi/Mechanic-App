import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CheckVinDto {
  @ApiProperty({
    description: '17-character Vehicle Identification Number',
    example: '1HGBH41JXMN109186',
    minLength: 11,
    maxLength: 17,
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 17, { message: 'VIN must be 11–17 characters' })
  @Matches(/^[A-HJ-NPR-Z0-9]+$/i, {
    message: 'VIN can only contain letters (except I, O, Q) and numbers',
  })
  vin: string;
}
