import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Role, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  RegisterExternalMechanicDto,
  ExternalMechanicResponseDto,
  VerifyExternalMechanicDto,
} from './dto/external-mechanic.dto';

@Injectable()
export class ExternalMechanicService {
  private readonly logger = new Logger(ExternalMechanicService.name);
  private readonly DEFAULT_COMMISSION_RATE = 15; // 15% commission for external mechanics

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new external mechanic
   */
  async registerExternalMechanic(dto: RegisterExternalMechanicDto): Promise<ExternalMechanicResponseDto> {
    const operation = `Register external mechanic: ${dto.email}`;
    this.logger.log(`[${operation}]`);

    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create external mechanic user
      const mechanic = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phoneNumber: dto.phoneNumber,
          role: Role.MECHANIC,
          status: Status.PENDING, // Requires admin verification
          shopName: dto.shopName,
          serviceRadiusKm: dto.serviceRadiusKm || 20,
          isEvSpecialist: dto.isEvSpecialist || false,
          isExternal: true, // Mark as external mechanic
          commissionRate: this.DEFAULT_COMMISSION_RATE, // Default commission rate
        },
      });

      this.logger.log(`[${operation}] External mechanic registered: ${mechanic.id}`);

      return {
        id: mechanic.id,
        email: mechanic.email,
        firstName: mechanic.firstName || '',
        lastName: mechanic.lastName || '',
        isExternal: mechanic.isExternal || false,
        verificationStatus: mechanic.status === Status.APPROVED ? 'VERIFIED' : 'PENDING',
        commissionRate: mechanic.commissionRate || this.DEFAULT_COMMISSION_RATE,
        createdAt: mechanic.createdAt,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to register external mechanic');
    }
  }

  /**
   * Verify or reject external mechanic (Admin only)
   */
  async verifyExternalMechanic(
    mechanicId: string,
    dto: VerifyExternalMechanicDto,
    adminId: string,
  ): Promise<ExternalMechanicResponseDto> {
    const operation = `Verify external mechanic: ${mechanicId}`;
    this.logger.log(`[${operation}] By admin ${adminId}`);

    try {
      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId, role: Role.MECHANIC },
      });

      if (!mechanic) {
        throw new NotFoundException('External mechanic not found');
      }

      if (!mechanic.isExternal) {
        throw new BadRequestException('User is not an external mechanic');
      }

      const newStatus = dto.status === 'VERIFIED' ? Status.APPROVED : Status.REJECTED;

      const updated = await this.prisma.user.update({
        where: { id: mechanicId },
        data: {
          status: newStatus,
          verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
          verifiedBy: dto.status === 'VERIFIED' ? adminId : null,
          rejectionReason: dto.status === 'REJECTED' ? dto.reason : null,
        },
      });

      this.logger.log(`[${operation}] Status updated to: ${dto.status}`);

      return {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        isExternal: updated.isExternal || false,
        verificationStatus: updated.status === Status.APPROVED ? 'VERIFIED' : 'PENDING',
        commissionRate: updated.commissionRate || this.DEFAULT_COMMISSION_RATE,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to verify external mechanic');
    }
  }

  /**
   * Get all external mechanics
   */
  async getAllExternalMechanics(verifiedOnly: boolean = false): Promise<ExternalMechanicResponseDto[]> {
    const operation = 'Get all external mechanics';
    this.logger.log(`[${operation}] Verified only: ${verifiedOnly}`);

    try {
      const where: any = {
        role: Role.MECHANIC,
        isExternal: true,
      };

      if (verifiedOnly) {
        where.status = Status.APPROVED;
      }

      const mechanics = await this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return mechanics.map((m) => ({
        id: m.id,
        email: m.email,
        firstName: m.firstName || '',
        lastName: m.lastName || '',
        isExternal: m.isExternal || false,
        verificationStatus: m.status === Status.APPROVED ? 'VERIFIED' : m.status === Status.REJECTED ? 'REJECTED' : 'PENDING',
        commissionRate: m.commissionRate || this.DEFAULT_COMMISSION_RATE,
        createdAt: m.createdAt,
      }));
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get external mechanics');
    }
  }

  /**
   * Get external mechanic by ID
   */
  async getExternalMechanic(mechanicId: string): Promise<ExternalMechanicResponseDto> {
    const operation = `Get external mechanic: ${mechanicId}`;
    this.logger.log(`[${operation}]`);

    try {
      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId, role: Role.MECHANIC, isExternal: true },
      });

      if (!mechanic) {
        throw new NotFoundException('External mechanic not found');
      }

      return {
        id: mechanic.id,
        email: mechanic.email,
        firstName: mechanic.firstName || '',
        lastName: mechanic.lastName || '',
        isExternal: mechanic.isExternal || false,
        verificationStatus: mechanic.status === Status.APPROVED ? 'VERIFIED' : mechanic.status === Status.REJECTED ? 'REJECTED' : 'PENDING',
        commissionRate: mechanic.commissionRate || this.DEFAULT_COMMISSION_RATE,
        createdAt: mechanic.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get external mechanic');
    }
  }

  /**
   * Update commission rate for external mechanic
   */
  async updateCommissionRate(mechanicId: string, commissionRate: number, adminId: string): Promise<ExternalMechanicResponseDto> {
    const operation = `Update commission rate for ${mechanicId}`;
    this.logger.log(`[${operation}] New rate: ${commissionRate}%`);

    try {
      if (commissionRate < 0 || commissionRate > 50) {
        throw new BadRequestException('Commission rate must be between 0 and 50%');
      }

      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId, role: Role.MECHANIC, isExternal: true },
      });

      if (!mechanic) {
        throw new NotFoundException('External mechanic not found');
      }

      const updated = await this.prisma.user.update({
        where: { id: mechanicId },
        data: {
          commissionRate,
          commissionUpdatedAt: new Date(),
          commissionUpdatedBy: adminId,
        },
      });

      this.logger.log(`[${operation}] Commission rate updated`);

      return {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        isExternal: updated.isExternal || false,
        verificationStatus: updated.status === Status.APPROVED ? 'VERIFIED' : 'PENDING',
        commissionRate: updated.commissionRate || this.DEFAULT_COMMISSION_RATE,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update commission rate');
    }
  }
}
