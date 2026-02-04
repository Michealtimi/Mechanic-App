import { ApiProperty } from '@nestjs/swagger';

export class EvHealthMetricsDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'Overall health score (0-100)' })
  overallHealthScore: number;

  @ApiProperty({ description: 'Battery health (0-100)' })
  batteryHealth: number;

  @ApiProperty({ description: 'Average battery level' })
  averageBatteryLevel: number;

  @ApiProperty({ description: 'Charging efficiency (%)' })
  chargingEfficiency: number;

  @ApiProperty({ description: 'Range degradation (%)' })
  rangeDegradation: number;

  @ApiProperty({ description: 'Health alerts' })
  alerts: HealthAlertDto[];

  @ApiProperty({ description: 'Last updated' })
  lastUpdated: Date;
}

export class HealthAlertDto {
  @ApiProperty({ description: 'Alert type' })
  type: 'LOW_BATTERY' | 'CHARGING_ISSUE' | 'RANGE_DEGRADATION' | 'MAINTENANCE_REQUIRED';

  @ApiProperty({ description: 'Alert message' })
  message: string;

  @ApiProperty({ description: 'Severity' })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ description: 'Timestamp' })
  timestamp: Date;
}
