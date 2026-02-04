import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MetricSource, Role } from '@prisma/client';
import { CreateMetricDto } from './dto/create-metric.dto';
import { MetricFilterDto } from './dto/metric-filter.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Record a telemetry metric for a vehicle
   * Enforces tenant isolation - users can only record metrics for vehicles in their organization
   */
  async recordMetric(dto: CreateMetricDto, userId: string, userRole: Role, tenantId: string) {
    const operation = `Record metric for vehicle ${dto.vehicleId}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}`);

    try {
      // Verify vehicle exists and user has access
      const vehicle = await this.vehiclesService.getVehicle(dto.vehicleId, userId, userRole, tenantId);

      // Validate metric values
      if (dto.batteryLevel !== undefined && (dto.batteryLevel < 0 || dto.batteryLevel > 100)) {
        throw new BadRequestException('Battery level must be between 0 and 100');
      }

      if (dto.soc !== undefined && (dto.soc < 0 || dto.soc > 1)) {
        throw new BadRequestException('State of Charge (SOC) must be between 0 and 1');
      }

      if (dto.rangeKm !== undefined && dto.rangeKm < 0) {
        throw new BadRequestException('Range must be a positive number');
      }

      // Create metric
      const metric = await this.prisma.eVMetric.create({
        data: {
          vehicleId: dto.vehicleId,
          batteryLevel: dto.batteryLevel,
          soc: dto.soc,
          rangeKm: dto.rangeKm,
          source: dto.source || MetricSource.MANUAL,
          metadata: dto.metadata,
        },
        include: {
          vehicle: {
            select: {
              id: true,
              vin: true,
              type: true,
              make: true,
              model: true,
            },
          },
        },
      });

      // Audit log
      await this.auditService.log({
        actor: userId,
        entity: 'EVMetric',
        entityId: metric.id,
        action: 'CREATE',
        after: metric,
        metadata: {
          vehicleId: dto.vehicleId,
          source: dto.source || MetricSource.MANUAL,
        },
      });

      this.logger.log(`[${operation}] Metric ${metric.id} recorded successfully`);
      return metric;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to record metric');
    }
  }

  /**
   * Get all metrics for a vehicle
   * Enforces tenant isolation
   */
  async getVehicleMetrics(
    vehicleId: string,
    filters: MetricFilterDto,
    userId: string,
    userRole: Role,
    tenantId: string,
  ) {
    const operation = `Get metrics for vehicle ${vehicleId}`;
    this.logger.log(`[${operation}] Requested by user ${userId}`);

    try {
      // Verify vehicle exists and user has access
      await this.vehiclesService.getVehicle(vehicleId, userId, userRole, tenantId);

      // Build where clause
      const where: any = {
        vehicleId,
      };

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.timestamp.lte = new Date(filters.endDate);
        }
      }

      if (filters.source) {
        where.source = filters.source;
      }

      const metrics = await this.prisma.eVMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: filters.skip || 0,
        take: filters.take || 50,
        include: {
          vehicle: {
            select: {
              id: true,
              vin: true,
              type: true,
            },
          },
        },
      });

      const total = await this.prisma.eVMetric.count({ where });

      this.logger.log(`[${operation}] Retrieved ${metrics.length} metrics (total: ${total})`);
      return {
        data: metrics,
        meta: {
          total,
          skip: filters.skip || 0,
          take: filters.take || 50,
        },
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve metrics');
    }
  }

  /**
   * Get the latest metric for a vehicle
   * Enforces tenant isolation
   */
  async getLatestMetric(vehicleId: string, userId: string, userRole: Role, tenantId: string) {
    const operation = `Get latest metric for vehicle ${vehicleId}`;
    this.logger.log(`[${operation}] Requested by user ${userId}`);

    try {
      // Verify vehicle exists and user has access
      await this.vehiclesService.getVehicle(vehicleId, userId, userRole, tenantId);

      const metric = await this.prisma.eVMetric.findFirst({
        where: { vehicleId },
        orderBy: { timestamp: 'desc' },
        include: {
          vehicle: {
            select: {
              id: true,
              vin: true,
              type: true,
              make: true,
              model: true,
            },
          },
        },
      });

      if (!metric) {
        this.logger.warn(`[${operation}] No metrics found for vehicle`);
        throw new NotFoundException('No metrics found for this vehicle');
      }

      this.logger.log(`[${operation}] Latest metric retrieved successfully`);
      return metric;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve latest metric');
    }
  }
}
