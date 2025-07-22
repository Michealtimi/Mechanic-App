import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client'; // or wherever your Role enum is
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
 @ApiProperty({ example: 'test@gmail.com', description: 'Unique emailof mechanic ' })
  @IsEmail()
  email: string;

  
  
@ApiProperty({ example: 'password', description: 'Unique password of mechanic ' })
  @IsString()
  password: string;

@ApiPropertyOptional({ example: 'Lagos, Nigeria', description: 'Location of the mechanic' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role; // Only usable by admins
}
