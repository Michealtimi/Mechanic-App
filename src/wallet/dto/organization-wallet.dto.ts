import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, IsEnum, Min, IsObject } from 'class-validator';

export class TransferFundsDto {
  @ApiProperty({ description: 'Source type: user or org', enum: ['user', 'org'] })
  @IsEnum(['user', 'org'])
  fromType: 'user' | 'org';

  @ApiProperty({ description: 'Source ID (user ID or org ID)' })
  @IsUUID()
  fromId: string;

  @ApiProperty({ description: 'Destination type: user or org', enum: ['user', 'org'] })
  @IsEnum(['user', 'org'])
  toType: 'user' | 'org';

  @ApiProperty({ description: 'Destination ID (user ID or org ID)' })
  @IsUUID()
  toId: string;

  @ApiProperty({ description: 'Amount to transfer', example: 1000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreditOrgWalletDto {
  @ApiProperty({ description: 'Amount to credit', example: 1000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Transaction type', example: 'CREDIT', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Related booking ID', required: false })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class DebitOrgWalletDto {
  @ApiProperty({ description: 'Amount to debit', example: 500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Transaction type', example: 'DEBIT', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Related booking ID', required: false })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BulkPaymentDto {
  @ApiProperty({ description: 'Array of payment recipients', type: [Object] })
  recipients: Array<{
    userId?: string;
    orgId?: string;
    amount: number;
    type?: string;
    metadata?: Record<string, any>;
  }>;

  @ApiProperty({ description: 'Source organization ID' })
  @IsUUID()
  sourceOrgId: string;
}

export class OrganizationWalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty({ type: 'number' })
  balance: number;

  @ApiProperty({ type: 'number' })
  pending: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WalletTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  walletId?: string;

  @ApiProperty({ required: false })
  orgWalletId?: string;

  @ApiProperty({ required: false })
  bookingId?: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: 'number' })
  amount: number;

  @ApiProperty({ type: 'number' })
  balanceAfter: number;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;
}
