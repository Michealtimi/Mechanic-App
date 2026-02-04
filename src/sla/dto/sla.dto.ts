import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlaStatus } from '@prisma/client';

export class SlaDashboardDto {
  @ApiProperty({ description: 'Total SLA records' })
  total: number;

  @ApiProperty({ description: 'Met SLA count' })
  met: number;

  @ApiProperty({ description: 'Breached SLA count' })
  breached: number;

  @ApiProperty({ description: 'Pending SLA count' })
  pending: number;

  @ApiProperty({ description: 'SLA compliance rate (%)' })
  complianceRate: number;

  @ApiProperty({ description: 'Average breach time (minutes)' })
  averageBreachTime: number;

  @ApiProperty({ description: 'Breaches by reason' })
  breachesByReason: Record<string, number>;
}

export class SlaAnalyticsDto {
  @ApiProperty({ description: 'SLA records by status' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'SLA compliance rate over time' })
  complianceByPeriod: Array<{ period: string; complianceRate: number; total: number }>;

  @ApiProperty({ description: 'Average response time (minutes)' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Total breaches' })
  totalBreaches: number;

  @ApiProperty({ description: 'Breach rate (%)' })
  breachRate: number;
}

export class SlaPenaltyDto {
  @ApiProperty({ description: 'Penalty amount' })
  amount: number;

  @ApiProperty({ description: 'Penalty reason' })
  reason: string;

  @ApiProperty({ description: 'Applied to mechanic' })
  mechanicId: string;
}
