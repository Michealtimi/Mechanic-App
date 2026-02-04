import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { VehicleStatus, Role, ServiceRecordSource } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new vehicle for an organization
   * Enforces tenant isolation - users can only create vehicles in their own organization
   */
  async createVehicle(dto: CreateVehicleDto, userId: string, userRole: Role, tenantId: string) {
    const operation = `Create vehicle for org ${dto.orgId}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}`);

    try {
      // Verify organization exists and user has access
      if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
        // Verify user is a member of the organization
        const membership = await this.prisma.orgMember.findUnique({
          where: {
            orgId_userId: {
              orgId: dto.orgId,
              userId,
            },
          },
        });

        if (!membership && dto.orgId !== tenantId) {
          this.logger.warn(`[${operation}] User ${userId} attempted to create vehicle in org ${dto.orgId} without access`);
          throw new ForbiddenException('You do not have permission to create vehicles in this organization');
        }
      }

      // Verify organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: dto.orgId },
      });

      if (!organization) {
        this.logger.warn(`[${operation}] Organization ${dto.orgId} not found`);
        throw new NotFoundException('Organization not found');
      }

      // Validate VIN uniqueness if provided
      if (dto.vin) {
        const existingVehicle = await this.prisma.vehicle.findUnique({
          where: { vin: dto.vin },
        });

        if (existingVehicle) {
          this.logger.warn(`[${operation}] VIN ${dto.vin} already exists`);
          throw new BadRequestException('Vehicle with this VIN already exists');
        }
      }

      // Validate coordinates if provided
      if (dto.lat !== undefined || dto.lng !== undefined) {
        if (dto.lat !== undefined && (dto.lat < -90 || dto.lat > 90)) {
          throw new BadRequestException('Invalid latitude. Must be between -90 and 90');
        }
        if (dto.lng !== undefined && (dto.lng < -180 || dto.lng > 180)) {
          throw new BadRequestException('Invalid longitude. Must be between -180 and 180');
        }
      }

      // Create vehicle
      const vehicle = await this.prisma.vehicle.create({
        data: {
          orgId: dto.orgId,
          vin: dto.vin,
          type: dto.type,
          make: dto.make,
          model: dto.model,
          year: dto.year,
          telematics: dto.telematics,
          status: VehicleStatus.ACTIVE,
          lat: dto.lat !== undefined ? new Decimal(dto.lat) : null,
          lng: dto.lng !== undefined ? new Decimal(dto.lng) : null,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              metrics: true,
            },
          },
        },
      });

      // Audit log
      await this.auditService.log({
        actor: userId,
        entity: 'Vehicle',
        entityId: vehicle.id,
        action: 'CREATE',
        after: vehicle,
        metadata: {
          orgId: dto.orgId,
          type: dto.type,
        },
      });

      this.logger.log(`[${operation}] Vehicle ${vehicle.id} created successfully`);
      return vehicle;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create vehicle');
    }
  }

  /**
   * Get vehicle by ID
   * Enforces tenant isolation - users can only access vehicles from their organization
   */
  async getVehicle(vehicleId: string, userId: string, userRole: Role, tenantId: string) {
    const operation = `Get vehicle ${vehicleId}`;
    this.logger.log(`[${operation}] Requested by user ${userId}`);

    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              metrics: true,
            },
          },
        },
      });

      if (!vehicle) {
        this.logger.warn(`[${operation}] Vehicle not found`);
        throw new NotFoundException('Vehicle not found');
      }

      // Platform admins can access any vehicle
      if (userRole === Role.SUPERADMIN || userRole === Role.ADMIN) {
        this.logger.debug(`[${operation}] Admin access granted`);
        return vehicle;
      }

      // Verify user has access to this vehicle's organization
      if (vehicle.orgId !== tenantId) {
        this.logger.warn(`[${operation}] User ${userId} attempted to access vehicle from different org`);
        throw new ForbiddenException('You do not have access to this vehicle');
      }

      this.logger.log(`[${operation}] Vehicle retrieved successfully`);
      return vehicle;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve vehicle');
    }
  }

  /**
   * Update vehicle
   * Enforces tenant isolation and ownership verification
   */
  async updateVehicle(
    vehicleId: string,
    dto: UpdateVehicleDto,
    userId: string,
    userRole: Role,
    tenantId: string,
  ) {
    const operation = `Update vehicle ${vehicleId}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}`);

    try {
      // Get existing vehicle
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!existingVehicle) {
        this.logger.warn(`[${operation}] Vehicle not found`);
        throw new NotFoundException('Vehicle not found');
      }

      // Verify access
      if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
        if (existingVehicle.orgId !== tenantId) {
          this.logger.warn(`[${operation}] User ${userId} attempted to update vehicle from different org`);
          throw new ForbiddenException('You do not have access to this vehicle');
        }

        // Verify user is a member of the organization
        const membership = await this.prisma.orgMember.findUnique({
          where: {
            orgId_userId: {
              orgId: existingVehicle.orgId,
              userId,
            },
          },
        });

        if (!membership) {
          this.logger.warn(`[${operation}] User ${userId} is not a member of org ${existingVehicle.orgId}`);
          throw new ForbiddenException('You do not have permission to update vehicles in this organization');
        }
      }

      // Validate VIN uniqueness if being updated
      if (dto.vin && dto.vin !== existingVehicle.vin) {
        const existingWithVin = await this.prisma.vehicle.findUnique({
          where: { vin: dto.vin },
        });

        if (existingWithVin) {
          this.logger.warn(`[${operation}] VIN ${dto.vin} already exists`);
          throw new BadRequestException('Vehicle with this VIN already exists');
        }
      }

      // Validate coordinates if provided
      if (dto.lat !== undefined && (dto.lat < -90 || dto.lat > 90)) {
        throw new BadRequestException('Invalid latitude. Must be between -90 and 90');
      }
      if (dto.lng !== undefined && (dto.lng < -180 || dto.lng > 180)) {
        throw new BadRequestException('Invalid longitude. Must be between -180 and 180');
      }

      const before = { ...existingVehicle };

      // Prepare update data
      const updateData: any = {};
      if (dto.vin !== undefined) updateData.vin = dto.vin;
      if (dto.type !== undefined) updateData.type = dto.type;
      if (dto.make !== undefined) updateData.make = dto.make;
      if (dto.model !== undefined) updateData.model = dto.model;
      if (dto.year !== undefined) updateData.year = dto.year;
      if (dto.telematics !== undefined) updateData.telematics = dto.telematics;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.lat !== undefined) updateData.lat = dto.lat;
      if (dto.lng !== undefined) updateData.lng = dto.lng;

      // Update vehicle
      const updated = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: updateData,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      // Audit log
      await this.auditService.log({
        actor: userId,
        entity: 'Vehicle',
        entityId: vehicleId,
        action: 'UPDATE',
        before,
        after: updated,
      });

      this.logger.log(`[${operation}] Vehicle updated successfully`);
      return updated;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update vehicle');
    }
  }

  /**
   * Delete vehicle (soft delete)
   * Enforces tenant isolation and ownership verification
   */
  async deleteVehicle(vehicleId: string, userId: string, userRole: Role, tenantId: string) {
    const operation = `Delete vehicle ${vehicleId}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}`);

    try {
      // Get existing vehicle
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        this.logger.warn(`[${operation}] Vehicle not found`);
        throw new NotFoundException('Vehicle not found');
      }

      // Verify access
      if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
        if (vehicle.orgId !== tenantId) {
          this.logger.warn(`[${operation}] User ${userId} attempted to delete vehicle from different org`);
          throw new ForbiddenException('You do not have access to this vehicle');
        }

        // Verify user is a member of the organization
        const membership = await this.prisma.orgMember.findUnique({
          where: {
            orgId_userId: {
              orgId: vehicle.orgId,
              userId,
            },
          },
        });

        if (!membership) {
          this.logger.warn(`[${operation}] User ${userId} is not a member of org ${vehicle.orgId}`);
          throw new ForbiddenException('You do not have permission to delete vehicles in this organization');
        }
      }

      // Check if vehicle has active bookings
      const activeBookings = await this.prisma.booking.count({
        where: {
          vehicleId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'],
          },
        },
      });

      if (activeBookings > 0) {
        this.logger.warn(`[${operation}] Vehicle has ${activeBookings} active bookings`);
        throw new BadRequestException(
          `Cannot delete vehicle with ${activeBookings} active booking(s). Please cancel or complete bookings first.`,
        );
      }

      // Soft delete
      const before = { ...vehicle };
      const deleted = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { deletedAt: new Date() },
      });

      // Audit log
      await this.auditService.log({
        actor: userId,
        entity: 'Vehicle',
        entityId: vehicleId,
        action: 'DELETE',
        before,
        after: deleted,
      });

      this.logger.log(`[${operation}] Vehicle soft deleted successfully`);
      return { success: true, message: 'Vehicle deleted successfully' };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete vehicle');
    }
  }

  /**
   * Get all vehicles for an organization
   * Enforces tenant isolation
   */
  async getOrgVehicles(orgId: string, userId: string, userRole: Role, tenantId: string) {
    const operation = `Get vehicles for org ${orgId}`;
    this.logger.log(`[${operation}] Requested by user ${userId}`);

    try {
      // Verify access to organization
      if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
        if (orgId !== tenantId) {
          this.logger.warn(`[${operation}] User ${userId} attempted to access vehicles from different org`);
          throw new ForbiddenException('You do not have access to this organization');
        }
      }

      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          orgId,
          deletedAt: null, // Exclude soft-deleted vehicles
        },
        include: {
          _count: {
            select: {
              bookings: true,
              metrics: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`[${operation}] Retrieved ${vehicles.length} vehicles`);
      return vehicles;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve vehicles');
    }
  }

  /**
   * Update vehicle location
   * Used for real-time tracking
   */
  async updateVehicleLocation(
    vehicleId: string,
    lat: number,
    lng: number,
    userId: string,
    userRole: Role,
    tenantId: string,
  ) {
    const operation = `Update location for vehicle ${vehicleId}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}`);

    try {
      // Validate coordinates
      if (lat < -90 || lat > 90) {
        throw new BadRequestException('Invalid latitude. Must be between -90 and 90');
      }
      if (lng < -180 || lng > 180) {
        throw new BadRequestException('Invalid longitude. Must be between -180 and 180');
      }

      // Get vehicle and verify access
      const vehicle = await this.getVehicle(vehicleId, userId, userRole, tenantId);

      // Update location
      const updated = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          lat: new Decimal(lat),
          lng: new Decimal(lng),
        },
      });

      // Audit log
      await this.auditService.log({
        actor: userId,
        entity: 'Vehicle',
        entityId: vehicleId,
        action: 'UPDATE_LOCATION',
        metadata: {
          lat,
          lng,
          previousLat: vehicle.lat,
          previousLng: vehicle.lng,
        },
      });

      this.logger.log(`[${operation}] Location updated successfully`);
      return updated;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update vehicle location');
    }
  }

  /**
   * Invisible Foreman: Add service record (manual or from telemetry). Predictive Fleet Garage.
   */
  async createServiceRecord(
    vehicleId: string,
    dto: {
      type: string;
      serviceDate: Date;
      odometerKm?: number;
      notes?: string;
      bookingId?: string;
      bookingSegmentId?: string;
      source?: ServiceRecordSource;
    },
    userId: string,
    userRole: Role,
    tenantId: string,
  ) {
    await this.getVehicle(vehicleId, userId, userRole, tenantId);
    const record = await this.prisma.vehicleServiceRecord.create({
      data: {
        vehicleId,
        type: dto.type,
        serviceDate: dto.serviceDate,
        odometerKm: dto.odometerKm,
        notes: dto.notes,
        bookingId: dto.bookingId,
        bookingSegmentId: dto.bookingSegmentId,
        source: dto.source ?? ServiceRecordSource.MANUAL,
      },
    });
    return record;
  }

  /**
   * Invisible Foreman: List service history for vehicle (Predictive Fleet Garage).
   */
  async getServiceHistory(
    vehicleId: string,
    userId: string,
    userRole: Role,
    tenantId: string,
  ) {
    await this.getVehicle(vehicleId, userId, userRole, tenantId);
    const records = await this.prisma.vehicleServiceRecord.findMany({
      where: { vehicleId },
      orderBy: { serviceDate: 'desc' },
    });
    return records;
  }
}
