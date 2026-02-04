import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';

export class AddMemberDto {
  @ApiProperty({
    description: 'User ID to add to organization',
    example: 'user-uuid-here',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Role to assign in the organization',
    enum: OrgRole,
    example: OrgRole.MEMBER,
  })
  @IsEnum(OrgRole)
  @IsNotEmpty()
  role: OrgRole;
}
