import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EvHealthMetricsDto, HealthAlertDto } from './dto/ev-health.dto';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class EvHealthService {
  private readonly logger = new Logger(EvHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  /**
   * Calculate EV health metrics for a vehicle
   */
  async calculateHealthMetrics(vehicleId: string): Promise<EvHealthMetricsDto> {
    const operation = `Calculate health metrics for vehicle ${vehicleId}`;
    this.logger.log(`[${operation}]`);

    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      if (vehicle.type !== 'EV') {
        throw new NotFoundException('Vehicle is not an EV');
      }

      // Get recent metrics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const metrics = await this.prisma.eVMetric.findMany({
        where: {
          vehicleId,
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      if (metrics.length === 0) {
        return {
          vehicleId,
          overallHealthScore: 0,
          batteryHealth: 0,
          averageBatteryLevel: 0,
          chargingEfficiency: 0,
          rangeDegradation: 0,
          alerts: [],
          lastUpdated: new Date(),
        };
      }

      // Calculate metrics
      const averageBatteryLevel =
        metrics.reduce((sum, m) => sum + (m.batteryLevel || 0), 0) / metrics.length;

      const batteryHealth = this.calculateBatteryHealth(metrics);
      const chargingEfficiency = this.calculateChargingEfficiency(metrics);
      const rangeDegradation = this.calculateRangeDegradation(metrics, vehicle);

      // Generate alerts
      const alerts = this.generateHealthAlerts(metrics, batteryHealth, rangeDegradation);

      // Overall health score (weighted average)
      const overallHealthScore = Math.round(
        batteryHealth * 0.4 + // 40% weight
        (averageBatteryLevel / 100) * 100 * 0.3 + // 30% weight
        (100 - rangeDegradation) * 0.2 + // 20% weight
        (chargingEfficiency / 100) * 100 * 0.1, // 10% weight
      );

      return {
        vehicleId,
        overallHealthScore: Math.max(0, Math.min(100, overallHealthScore)),
        batteryHealth,
        averageBatteryLevel: Number(averageBatteryLevel.toFixed(2)),
        chargingEfficiency: Number(chargingEfficiency.toFixed(2)),
        rangeDegradation: Number(rangeDegradation.toFixed(2)),
        alerts,
        lastUpdated: new Date(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to calculate health metrics');
    }
  }

  /**
   * Get health alerts for a vehicle
   */
  async getHealthAlerts(vehicleId: string): Promise<HealthAlertDto[]> {
    const metrics = await this.calculateHealthMetrics(vehicleId);
    return metrics.alerts;
  }

  private calculateBatteryHealth(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    // Battery health based on average level and consistency
    const avgLevel = metrics.reduce((sum, m) => sum + (m.batteryLevel || 0), 0) / metrics.length;
    
    // Check for rapid drops (indicates battery degradation)
    let rapidDrops = 0;
    for (let i = 1; i < metrics.length; i++) {
      const prev = metrics[i - 1].batteryLevel || 0;
      const curr = metrics[i].batteryLevel || 0;
      if (prev - curr > 10) {
        // Drop of more than 10% between readings
        rapidDrops++;
      }
    }

    const degradationPenalty = Math.min(rapidDrops * 5, 30); // Max 30 point penalty
    return Math.max(0, Math.min(100, avgLevel - degradationPenalty));
  }

  private calculateChargingEfficiency(metrics: any[]): number {
    // Find charging sessions (battery level increases)
    const chargingSessions: Array<{ start: number; end: number; duration: number }> = [];
    
    for (let i = 1; i < metrics.length; i++) {
      const prev = metrics[i - 1].batteryLevel || 0;
      const curr = metrics[i].batteryLevel || 0;
      
      if (curr > prev) {
        // Charging detected
        const startTime = metrics[i - 1].createdAt.getTime();
        const endTime = metrics[i].createdAt.getTime();
        const duration = (endTime - startTime) / (1000 * 60); // minutes
        
        chargingSessions.push({
          start: prev,
          end: curr,
          duration,
        });
      }
    }

    if (chargingSessions.length === 0) return 0;

    // Calculate average charging rate (percentage per minute)
    const avgRate = chargingSessions.reduce((sum, session) => {
      const increase = session.end - session.start;
      const rate = session.duration > 0 ? increase / session.duration : 0;
      return sum + rate;
    }, 0) / chargingSessions.length;

    // Normalize to 0-100 (assuming ideal is 1% per minute = 100%)
    return Math.min(100, avgRate * 100);
  }

  private calculateRangeDegradation(metrics: any[], vehicle: any): number {
    // Compare current range with expected range for vehicle type
    // This is a simplified calculation - in production, use manufacturer specs
    
    const ranges = metrics
      .filter((m) => m.rangeKm !== null && m.rangeKm !== undefined)
      .map((m) => m.rangeKm || 0);

    if (ranges.length === 0) return 0;

    const avgRange = ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
    
    // Expected range for EV (simplified - should use vehicle specs)
    const expectedRange = 300; // km (placeholder)
    
    if (expectedRange === 0) return 0;
    
    const degradation = ((expectedRange - avgRange) / expectedRange) * 100;
    return Math.max(0, Math.min(100, degradation));
  }

  private generateHealthAlerts(
    metrics: any[],
    batteryHealth: number,
    rangeDegradation: number,
  ): HealthAlertDto[] {
    const alerts: HealthAlertDto[] = [];
    const now = new Date();

    // Low battery alert
    const latestMetric = metrics[0];
    if (latestMetric && latestMetric.batteryLevel && latestMetric.batteryLevel < 20) {
      alerts.push({
        type: 'LOW_BATTERY',
        message: `Battery level is critically low (${latestMetric.batteryLevel}%)`,
        severity: latestMetric.batteryLevel < 10 ? 'CRITICAL' : 'HIGH',
        timestamp: now,
      });
    }

    // Battery health alert
    if (batteryHealth < 50) {
      alerts.push({
        type: 'MAINTENANCE_REQUIRED',
        message: `Battery health is degraded (${batteryHealth.toFixed(1)}%)`,
        severity: batteryHealth < 30 ? 'CRITICAL' : 'MEDIUM',
        timestamp: now,
      });
    }

    // Range degradation alert
    if (rangeDegradation > 30) {
      alerts.push({
        type: 'RANGE_DEGRADATION',
        message: `Vehicle range has degraded significantly (${rangeDegradation.toFixed(1)}%)`,
        severity: rangeDegradation > 50 ? 'HIGH' : 'MEDIUM',
        timestamp: now,
      });
    }

    // Charging issue detection
    const chargingMetrics = metrics.filter((m) => {
      // Check if metric indicates charging
      return m.metadata && (m.metadata as any).chargingStatus === 'CHARGING';
    });

    if (chargingMetrics.length > 0) {
      // Check for slow charging
      const avgChargingRate = this.calculateChargingEfficiency(metrics);
      if (avgChargingRate < 30) {
        alerts.push({
          type: 'CHARGING_ISSUE',
          message: 'Charging efficiency is below normal',
          severity: 'MEDIUM',
          timestamp: now,
        });
      }
    }

    return alerts;
  }
}
