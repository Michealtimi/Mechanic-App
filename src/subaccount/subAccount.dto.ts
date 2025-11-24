// src/modules/subaccount/subaccount.dto.ts

import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  Min, 
  Max, 
  IsMilitaryTime, 
  Length, 
  IsDigits
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubaccountDto {

  @ApiProperty({ description: 'The official registered business name for the subaccount.', example: 'QuickFix Auto Services Ltd.' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'The bank code (e.g., 058 for GTBank in Nigeria). Must be exactly 3 digits.', example: '058' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3, { message: 'Bank code must be exactly 3 characters (e.g., NIBSS code).' })
  bankCode: string;

  @ApiProperty({ description: 'The recipient bank account number. Usually 10 digits.', example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'Account number must be exactly 10 digits.' })
  @IsDigits()
  accountNumber: string;

  @ApiProperty({ description: 'The percentage charge the platform retains from transactions (1-100).', example: 10 })
  @IsNumber()
  @Min(0, { message: 'Percentage charge cannot be negative.' })
  @Max(100, { message: 'Percentage charge cannot exceed 100.' })
  @IsNotEmpty()
  percentageCharge: number; // e.g., 10 = 10%
}

