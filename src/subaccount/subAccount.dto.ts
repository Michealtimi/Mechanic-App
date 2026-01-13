// src/modules/subaccount/subaccount.dto.ts

import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  Min, 
  Max,  
  Length,
  IsNumberString, 
  
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
  @IsNumberString()
  accountNumber: string;

  @ApiProperty({ description: 'The percentage charge the platform retains from transactions (1-100).', example: 10 })
  @IsNumber()
  @Min(0, { message: 'Percentage charge cannot be negative.' })
  @Max(100, { message: 'Percentage charge cannot exceed 100.' })
  @IsNotEmpty()
  percentageCharge: number; // e.g., 10 = 10%
}

export class QuerySubaccountsDto {
  @ApiProperty({ required: false, default: 1, description: 'Page number for pagination.' })
  @IsOptional()
  @Type(() => Number) // Converts string from query params to number
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, description: 'Items per page for pagination.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;


}
