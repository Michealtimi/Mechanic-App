import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OrgType, OrgRole, Role } from '@prisma/client';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AuditService } from '../audit/audit.service';
import { OrganizationWalletService } from '../wallet/organization-wallet.service';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => OrganizationWalletService))
    private readonly orgWalletService: OrganizationWalletService,
  ) {}

  /**
   * Create a new organization
   * For B2C users, this creates a personal organization automatically
   * For B2B, this is explicitly created by the owner
   */
  async createOrganization(ownerId: string, dto: CreateOrganizationDto) {
    this.logger.log(`Creating organization ${dto.name} for owner ${ownerId}`);

    try {
      // Verify owner exists
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
      });

      if (!owner) {
        throw new NotFoundException('Owner not found');
      }

      // Create organization
      const organization = await this.prisma.organization.create({
        data: {
          name: dto.name,
          ownerId,
          type: dto.type || OrgType.B2C,
          walletBalance: 0,
          members: {
            create: {
              userId: ownerId,
              role: OrgRole.OWNER,
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Update user's tenantId to this organization (if not already set)
      if (!owner.tenantId) {
        await this.prisma.user.update({
          where: { id: ownerId },
          data: { tenantId: organization.id },
        });
      }

      // Create organization wallet (for B2B organizations)
      if (organization.type === OrgType.B2B) {
        try {
          await this.orgWalletService.ensureWallet(organization.id);
          this.logger.log(`Organization wallet created for ${organization.id}`);
        } catch (walletError) {
          this.logger.warn(`Failed to create wallet for org ${organization.id}: ${walletError.message}`);
          // Don't fail organization creation if wallet creation fails
        }
      }

      // Audit log
      await this.auditService.log({
        actor: ownerId,
        entity: 'Organization',
        entityId: organization.id,
        action: 'CREATE',
        after: organization,
      });

      this.logger.log(`Organization ${organization.id} created successfully`);
      
      // Include wallet info in response
      const orgWithWallet = await this.prisma.organization.findUnique({
        where: { id: organization.id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          wallet: true,
        },
      });

      return orgWithWallet;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create organization');
    }
  }

  /**
   * Get organization by ID
   * Enforces tenant isolation - users can only access their own organization
   */
  async getOrganization(orgId: string, userId: string, userRole: Role) {
    this.logger.log(`Fetching organization ${orgId} for user ${userId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        vehicles: {
          select: {
            id: true,
            vin: true,
            type: true,
            make: true,
            model: true,
            status: true,
          },
        },
        _count: {
          select: {
            members: true,
            vehicles: true,
            bookings: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Platform admins can access any organization
    if (userRole === Role.SUPERADMIN || userRole === Role.ADMIN) {
      return organization;
    }

    // Check if user is a member or owner
    const isMember = organization.members.some((m) => m.userId === userId);
    const isOwner = organization.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    return organization;
  }

  /**
   * Update organization
   * Only owner or org admin can update
   */
  async updateOrganization(
    orgId: string,
    dto: UpdateOrganizationDto,
    userId: string,
    userRole: Role,
  ) {
    this.logger.log(`Updating organization ${orgId} by user ${userId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check permissions
    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      const membership = await this.prisma.orgMember.findUnique({
        where: {
          orgId_userId: {
            orgId,
            userId,
          },
        },
      });

      if (!membership || (membership.role !== OrgRole.OWNER && membership.role !== OrgRole.ADMIN)) {
        throw new ForbiddenException(
          'Only organization owners and admins can update organization details',
        );
      }
    }

    const before = { ...organization };

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      actor: userId,
      entity: 'Organization',
      entityId: orgId,
      action: 'UPDATE',
      before,
      after: updated,
    });

    this.logger.log(`Organization ${orgId} updated successfully`);
    return updated;
  }

  /**
   * Add a member to the organization
   */
  async addMember(orgId: string, dto: AddMemberDto, userId: string, userRole: Role) {
    this.logger.log(`Adding member ${dto.userId} to organization ${orgId}`);

    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check permissions
    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      const membership = await this.prisma.orgMember.findUnique({
        where: {
          orgId_userId: {
            orgId,
            userId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== OrgRole.OWNER &&
          membership.role !== OrgRole.ADMIN &&
          membership.role !== OrgRole.FLEET_MANAGER)
      ) {
        throw new ForbiddenException(
          'You do not have permission to add members to this organization',
        );
      }
    }

    // Verify user exists
    const userToAdd = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!userToAdd) {
      throw new NotFoundException('User to add not found');
    }

    // Check if user is already a member
    const existing = await this.prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this organization');
    }

    // Add member
    const member = await this.prisma.orgMember.create({
      data: {
        orgId,
        userId: dto.userId,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update user's tenantId if not set
    if (!userToAdd.tenantId) {
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { tenantId: orgId },
      });
    }

    // Audit log
    await this.auditService.log({
      actor: userId,
      entity: 'OrgMember',
      entityId: member.id,
      action: 'CREATE',
      after: member,
    });

    this.logger.log(`Member ${dto.userId} added to organization ${orgId}`);
    return member;
  }

  /**
   * Remove a member from the organization
   */
  async removeMember(orgId: string, memberUserId: string, userId: string, userRole: Role) {
    this.logger.log(`Removing member ${memberUserId} from organization ${orgId}`);

    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Cannot remove owner
    if (organization.ownerId === memberUserId) {
      throw new BadRequestException('Cannot remove organization owner');
    }

    // Check permissions
    if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      const membership = await this.prisma.orgMember.findUnique({
        where: {
          orgId_userId: {
            orgId,
            userId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== OrgRole.OWNER && membership.role !== OrgRole.ADMIN)
      ) {
        throw new ForbiddenException(
          'You do not have permission to remove members from this organization',
        );
      }
    }

    // Remove member
    await this.prisma.orgMember.delete({
      where: {
        orgId_userId: {
          orgId,
          userId: memberUserId,
        },
      },
    });

    // Audit log
    await this.auditService.log({
      actor: userId,
      entity: 'OrgMember',
      entityId: `${orgId}-${memberUserId}`,
      action: 'DELETE',
      metadata: { orgId, memberUserId },
    });

    this.logger.log(`Member ${memberUserId} removed from organization ${orgId}`);
    return { success: true };
  }

  /**
   * Get all vehicles for an organization
   */
  async getOrgVehicles(orgId: string, userId: string, userRole: Role) {
    // Verify access
    await this.getOrganization(orgId, userId, userRole);

    return this.prisma.vehicle.findMany({
      where: { orgId },
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
  }

  /**
   * Get all members of an organization
   */
  async getOrgMembers(orgId: string, userId: string, userRole: Role) {
    // Verify access
    await this.getOrganization(orgId, userId, userRole);

    return this.prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
