// src/modules/admin/admin.dto.ts

import {
  IsBoolean,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DisputeStatus, PaymentStatus, Role } from '@prisma/client'; // Assuming these enums

// --- ResolveDisputeDto ---
export class ResolveDisputeDto {
  @ApiProperty({
    description: 'The resolution message or notes for the dispute.',
    example: 'Customer refunded due to mechanic no-show.',
  })
  @IsString({ message: 'Resolution must be a string' })
  @IsNotEmpty({ message: 'Resolution is required' })
  resolution: string;

  @ApiProperty({
    description: 'Indicates whether a refund should be processed to the customer.',
    example: true,
    default: false,
  })
  @IsBoolean()
  refundToCustomer: boolean;

  @ApiProperty({
    description: 'The amount to be refunded/debited (in the smallest currency unit). Required if refundToCustomer or debitMechanic is true.',
    example: 150000, // e.g., $15.00
    minimum: 0,
  })
  @Type(() => Number) // Convert incoming string/number to Number
  @IsNumber({}, { message: 'Refund amount must be a number' })
  @Min(0, { message: 'Refund amount cannot be negative' })
  refundAmount: number; // Using number for ease, but Decimal is safer for money. For DTO, number is fine.

  @ApiProperty({
    description: 'Indicates whether the mechanic should be debited.',
    example: true,
    default: false,
  })
  @IsBoolean()
  debitMechanic: boolean;

  // Add more fields if needed for complex resolutions (e.g., partial amounts, split payments)
}

// --- RefundPaymentDto ---
export class RefundPaymentDto {
  @ApiProperty({
    description: 'The amount to be refunded (in the smallest currency unit).',
    example: 50000, // e.g., $5.00
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;
}

// --- QueryDisputesDto ---
export class QueryDisputesDto {
  @ApiProperty({
    description: 'Filter disputes by status.',
    enum: DisputeStatus,
    required: false,
    example: DisputeStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(DisputeStatus, { message: 'Invalid dispute status' })
  status?: DisputeStatus;

  @ApiProperty({
    description: 'Filter disputes by customer ID.',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Customer ID must be a valid UUID' })
  customerId?: string;

  @ApiProperty({
    description: 'Filter disputes by mechanic ID.',
    required: false,
    example: 'f1e2d3c4-b5a6-9876-5432-10fedcba9876',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Mechanic ID must be a valid UUID' })
  mechanicId?: string;

  @ApiProperty({
    description: 'Page number for pagination.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

// --- QueryWalletsDto --- (New DTO for wallet listing)
export class QueryWalletsDto {
  @ApiProperty({
    description: 'Filter wallets by user ID.',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiProperty({
    description: 'Page number for pagination.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}


// --- Admin Payment Listing DTO ---
export class QueryPaymentsDto {
  @ApiProperty({
    description: 'Filter payments by user ID.',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;

  @ApiProperty({
    description: 'Filter payments by status.',
    enum: PaymentStatus,
    required: false,
    example: PaymentStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  status?: PaymentStatus;

  @ApiProperty({
    description: 'Page number for pagination.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}