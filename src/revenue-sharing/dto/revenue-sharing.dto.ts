import { IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RevenueShareDto {
  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Total booking amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Platform fee amount' })
  platformFee: number;

  @ApiProperty({ description: 'Mechanic commission amount' })
  mechanicCommission: number;

  @ApiProperty({ description: 'Mechanic commission rate (%)' })
  commissionRate: number;

  @ApiProperty({ description: 'Mechanic ID' })
  mechanicId: string;

  @ApiProperty({ description: 'Is external mechanic' })
  isExternal: boolean;
}

export class RevenueReportDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total platform fees' })
  totalPlatformFees: number;

  @ApiProperty({ description: 'Total mechanic commissions' })
  totalCommissions: number;

  @ApiProperty({ description: 'Number of bookings' })
  bookingCount: number;

  @ApiProperty({ description: 'Average commission rate' })
  averageCommissionRate: number;

  @ApiProperty({ description: 'External mechanics count' })
  externalMechanicsCount: number;

  @ApiProperty({ 
  description: 'Revenue by mechanic', 
  type: 'object', 
  additionalProperties: true // This tells Swagger: "It's an object with any keys"
})
  revenueByMechanic: Record<string, {
    mechanicId: string;
    mechanicName: string;
    totalRevenue: number;
    commission: number;
    bookingCount: number;
  }>;
}

export class RevenueFilterDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Mechanic ID' })
  @IsOptional()
  mechanicId?: string;

  @ApiPropertyOptional({ description: 'External mechanics only', default: false })
  @IsOptional()
  externalOnly?: boolean;
}
