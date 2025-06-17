import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

// Define Role enum locally if not available from Prisma
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  
}

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString() 
  @Length(3, 20, { message: 'Password must be between 3 and 20 characters' })
  password: string;


}

