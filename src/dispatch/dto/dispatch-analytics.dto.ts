import { ApiProperty } from '@nestjs/swagger';

export class DispatchAnalyticsDto {
  @ApiProperty({ description: 'Total dispatches' })
  total: number;

  @ApiProperty({ description: 'Accepted dispatches' })
  accepted: number;

  @ApiProperty({ description: 'Rejected dispatches' })
  rejected: number;

  @ApiProperty({ description: 'Timeout dispatches' })
  timeout: number;

  @ApiProperty({ description: 'Acceptance rate (%)' })
  acceptanceRate: number;

  @ApiProperty({ description: 'Average response time (minutes)' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Dispatches by status' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'Dispatches by period' })
  byPeriod: Array<{ period: string; count: number; acceptanceRate: number }>;
}

export class MechanicAvailabilityDto {
  @ApiProperty({ description: 'Mechanic ID' })
  mechanicId: string;

  @ApiProperty({ description: 'Availability score (0-100)' })
  availabilityScore: number;

  @ApiProperty({ description: 'Is currently available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Predicted availability in next hour' })
  predictedAvailable: boolean;

  @ApiProperty({ description: 'Current active bookings' })
  activeBookings: number;

  @ApiProperty({ description: 'Average completion time (minutes)' })
  averageCompletionTime: number;
}
