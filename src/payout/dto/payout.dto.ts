// src/payout/dtos/payout.dtos.ts (New file, or update existing)

import {
  IsString,
  IsNotEmpty,
  IsNumberString, // For BigInt or large numbers from client
  MinLength,
  MaxLength,
  IsPositive,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PayoutStatus } from '@prisma/client'; // Import PayoutStatus enum

// ---------------------------------------------------------------------
// Request DTO (for client-side payout requests)
// ---------------------------------------------------------------------
export class RequestPayoutDto {
  @ApiProperty({
    description: 'The amount to be paid out, in the smallest currency unit (e.g., kobo, cents).',
    example: '500000', // Example: 5000 (meaning 50.00 if currency is decimal)
    type: String, // Treat as string for BigInt/Decimal.js handling
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumberString({}, { message: 'Amount must be a numeric string' })
  // @Min(1, { message: 'Amount must be at least 1' }) // Add this if you want to ensure a positive amount from client side
  amount: string; // Changed to string to represent BigInt from client accurately

  @ApiProperty({
    description: 'The bank account number for the payout.',
    example: '0123456789',
    minLength: 10,
    maxLength: 12, // Common length for bank accounts
  })
  @IsNotEmpty({ message: 'Bank account number is required' })
  @IsString({ message: 'Bank account number must be a string' })
  @MinLength(10, { message: 'Bank account number must be at least 10 digits' })
  @MaxLength(12, { message: 'Bank account number cannot exceed 12 digits' })
  bankAccountNumber: string;

  @ApiProperty({
    description: 'The bank code (e.g., NIP code, SWIFT/BIC for international).',
    example: '044', // Example: GTBank code
    minLength: 3,
    maxLength: 10, // Max length can vary
  })
  @IsNotEmpty({ message: 'Bank code is required' })
  @IsString({ message: 'Bank code must be a string' })
  @MinLength(3, { message: 'Bank code must be at least 3 characters' })
  bankCode: string;

  // You might want to add bankName and accountName for verification
  @ApiProperty({
    description: 'The name of the bank.',
    example: 'Guaranty Trust Bank',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'The name of the account holder.',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountName?: string;
}

// ---------------------------------------------------------------------
// Update Status DTO (for internal use, or admin API)
// ---------------------------------------------------------------------
export class UpdatePayoutStatusDto {
  @ApiProperty({
    description: 'The new status for the payout.',
    enum: PayoutStatus,
    example: PayoutStatus.COMPLETED,
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(PayoutStatus, { message: 'Invalid payout status' })
  status: PayoutStatus;

  @ApiProperty({
    description: 'Optional reference from the payment provider.',
    example: 'TRANSFER_REF_XYZ123',
    required: false,
  })
  @IsOptional()
  @IsString()
  providerRef?: string;

  @ApiProperty({
    description: 'Optional reason if the payout failed or was cancelled.',
    example: 'Insufficient funds at gateway',
    required: false,
  })
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiProperty({
    description: 'Optional raw response from the payment gateway.',
    type: 'object',
    required: false,
  })
  @IsOptional()
  rawGatewayResponse?: any; // Consider a more specific type if schema is known
}

// ---------------------------------------------------------------------
// List Payouts DTO (for query parameters)
// ---------------------------------------------------------------------
export class ListPayoutsDto {
  @ApiProperty({
    description: 'Filter payouts by mechanic ID.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  mechanicId?: string;

  @ApiProperty({
    description: 'Filter payouts by status.',
    enum: PayoutStatus,
    example: PayoutStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(PayoutStatus, { message: 'Invalid payout status filter' })
  status?: PayoutStatus;

  @ApiProperty({
    description: 'Page number for pagination.',
    example: 1,
    default: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page.',
    example: 10,
    default: 10,
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number = 10;
}


// ---------------------------------------------------------------------
// PaymentsService.initiatePayoutTransfer return type (in your PaymentsService, or defined here for mocks)
// ---------------------------------------------------------------------
export interface InitiateTransferResult {
  success: boolean;
  message: string;
  providerRef?: string;
  rawGatewayResponse?: any;
}