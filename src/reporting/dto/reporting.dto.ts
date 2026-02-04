import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ReportType {
  BOOKING = 'BOOKING',
  REVENUE = 'REVENUE',
  MECHANIC_PERFORMANCE = 'MECHANIC_PERFORMANCE',
  ORGANIZATION = 'ORGANIZATION',
  DISPUTE = 'DISPUTE',
}

export enum TimeRange {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export class ReportFilterDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)', example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)', example: '2026-01-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TimeRange, description: 'Time range preset' })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @ApiPropertyOptional({ description: 'Organization ID filter' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Mechanic ID filter' })
  @IsOptional()
  @IsUUID()
  mechanicId?: string;

  @ApiPropertyOptional({ description: 'Customer ID filter' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Tenant ID filter' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class BookingAnalyticsDto {
  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Completed bookings' })
  completedBookings: number;

  @ApiProperty({ description: 'Cancelled bookings' })
  cancelledBookings: number;

  @ApiProperty({ description: 'Pending bookings' })
  pendingBookings: number;

  @ApiProperty({ description: 'Completion rate (%)' })
  completionRate: number;

  @ApiProperty({ description: 'Cancellation rate (%)' })
  cancellationRate: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Bookings by status' })
  bookingsByStatus: Record<string, number>;

  @ApiProperty({ description: 'Bookings by month' })
  bookingsByMonth: Array<{ month: string; count: number; revenue: number }>;
}

export class RevenueReportDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Platform fees collected' })
  platformFees: number;

  @ApiProperty({ description: 'Mechanic earnings' })
  mechanicEarnings: number;

  @ApiProperty({ description: 'Refunds issued' })
  refunds: number;

  @ApiProperty({ description: 'Net revenue' })
  netRevenue: number;

  @ApiProperty({ description: 'Revenue by organization' })
  revenueByOrganization: Array<{
    organizationId: string;
    organizationName: string;
    revenue: number;
    bookingCount: number;
  }>;

  @ApiProperty({ description: 'Revenue by time period' })
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    bookings: number;
  }>;
}

export class MechanicPerformanceDto {
  @ApiProperty({ description: 'Mechanic ID' })
  mechanicId: string;

  @ApiProperty({ description: 'Mechanic name' })
  mechanicName: string;

  @ApiProperty({ description: 'Total bookings completed' })
  totalBookings: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total earnings' })
  totalEarnings: number;

  @ApiProperty({ description: 'Completion rate (%)' })
  completionRate: number;

  @ApiProperty({ description: 'Average response time (minutes)' })
  averageResponseTime: number;

  @ApiProperty({ description: 'On-time completion rate (%)' })
  onTimeCompletionRate: number;

  @ApiProperty({ description: 'Disputes count' })
  disputesCount: number;

  @ApiProperty({ description: 'Resolved disputes count' })
  resolvedDisputesCount: number;
}

export class OrganizationReportDto {
  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Organization name' })
  organizationName: string;

  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Active vehicles' })
  activeVehicles: number;

  @ApiProperty({ description: 'Assigned mechanics' })
  assignedMechanics: number;

  @ApiProperty({ description: 'Total spending' })
  totalSpending: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Bookings by status' })
  bookingsByStatus: Record<string, number>;

  @ApiProperty({ description: 'Monthly spending trend' })
  monthlySpending: Array<{ month: string; amount: number; bookings: number }>;
}
