import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  fullName: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  shopName?: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  location?: string;

  @ApiProperty({ required: false, nullable: true, type: [String] })
  @Expose()
  skills?: string[];

  @ApiProperty({ required: false })
  @Expose()
  createdAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  updatedAt?: Date;
}
