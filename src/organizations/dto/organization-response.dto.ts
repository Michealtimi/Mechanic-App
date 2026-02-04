import { ApiProperty } from '@nestjs/swagger';
import { OrgType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class OrganizationResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  ownerId: string;

  @Expose()
  @ApiProperty({ enum: OrgType })
  type: OrgType;

  @Expose()
  @ApiProperty()
  walletBalance: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
