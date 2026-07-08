import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from '../../../src/organizations/organizations.service';
import { PaymentsService } from '../../../src/payment/payments.services';
import { PaymentGatewayFactory } from '../../../src/payment/payment-gateway.factory';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../../../src/wallet/wallet.service';
import { NotificationGateway } from '../../../src/notification/notification.gateway';
import { PaymentEventService } from '../../../src/payment/payment-event.service';
import { MetricsService } from '../../../src/metrics/metrics.service';
import { AuditService } from '../../../src/audit/audit.service';
import { OrganizationWalletService } from '../../../src/wallet/organization-wallet.service';
import { Role, OrgRole } from '@prisma/client';

describe('Tenant Isolation (Integration)', () => {
  describe('OrganizationsService', () => {
    let service: OrganizationsService;
    const orgA = 'org-tenant-a';
    const orgB = 'org-tenant-b';
    const userA = 'user-a';
    const userB = 'user-b';
    const adminId = 'admin-1';

    const organizationA = {
      id: orgA,
      name: 'Fleet A',
      ownerId: userA,
      type: 'B2B',
      members: [{ userId: userA, role: OrgRole.OWNER }],
      owner: { id: userA, email: 'a@test.com', firstName: 'A', lastName: 'User' },
      vehicles: [],
      _count: { members: 1, vehicles: 0, bookings: 0 },
    };

    const organizationB = {
      id: orgB,
      name: 'Fleet B',
      ownerId: userB,
      type: 'B2B',
      members: [{ userId: userB, role: OrgRole.OWNER }],
      owner: { id: userB, email: 'b@test.com', firstName: 'B', lastName: 'User' },
      vehicles: [],
      _count: { members: 1, vehicles: 0, bookings: 0 },
    };

    const prisma = {
      organization: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) => {
          if (where.id === orgA) return Promise.resolve(organizationA);
          if (where.id === orgB) return Promise.resolve(organizationB);
          return Promise.resolve(null);
        }),
      },
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrganizationsService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: OrganizationWalletService, useValue: { ensureWallet: jest.fn() } },
        ],
      }).compile();

      service = module.get(OrganizationsService);
    });

    it('allows a member to access their own organization', async () => {
      const result = await service.getOrganization(orgA, userA, Role.CUSTOMER);
      expect(result.id).toBe(orgA);
    });

    it('denies cross-tenant organization access', async () => {
      await expect(service.getOrganization(orgB, userA, Role.CUSTOMER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows ADMIN to access any organization', async () => {
      const result = await service.getOrganization(orgB, adminId, Role.ADMIN);
      expect(result.id).toBe(orgB);
    });

    it('allows SUPERADMIN to access any organization', async () => {
      const result = await service.getOrganization(orgA, adminId, Role.SUPERADMIN);
      expect(result.id).toBe(orgA);
    });

    it('returns NotFoundException for unknown organization', async () => {
      await expect(
        service.getOrganization('missing', userA, Role.CUSTOMER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PaymentsService', () => {
    let service: PaymentsService;

    const prisma = {
      booking: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) => {
          if (where.id === 'booking-1') {
            return Promise.resolve({
              id: 'booking-1',
              customerId: 'customer-a',
              orgId: 'org-tenant-a',
              customer: { email: 'c@test.com', tenantId: 'org-tenant-a' },
              organization: { members: [{ userId: 'customer-a' }] },
            });
          }
          if (where.id === 'booking-2') {
            return Promise.resolve({
              id: 'booking-2',
              customerId: 'customer-b',
              orgId: 'org-tenant-b',
              customer: { email: 'b@test.com', tenantId: 'org-tenant-b' },
              organization: { members: [{ userId: 'customer-b' }] },
            });
          }
          return Promise.resolve(null);
        }),
      },
      payment: { findUnique: jest.fn() },
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaymentsService,
          { provide: PrismaService, useValue: prisma },
          {
            provide: PaymentGatewayFactory,
            useValue: { resolve: jest.fn(), resolveName: jest.fn(), getDefault: jest.fn() },
          },
          { provide: ConfigService, useValue: { get: jest.fn((k: string) => (k === 'DEFAULT_CURRENCY' ? 'NGN' : undefined)) } },
          { provide: WalletService, useValue: {} },
          { provide: NotificationGateway, useValue: {} },
          { provide: PaymentEventService, useValue: { recordOrIgnore: jest.fn() } },
          { provide: MetricsService, useValue: { increment: jest.fn(), observe: jest.fn() } },
        ],
      }).compile();

      service = module.get(PaymentsService);
    });

    it('allows customer to pay for own booking', async () => {
      await expect(
        service.assertCanInitiatePayment('customer-a', Role.CUSTOMER, 'booking-1'),
      ).resolves.toBeUndefined();
    });

    it('blocks cross-tenant payment initiation', async () => {
      await expect(
        service.assertCanInitiatePayment('customer-a', Role.CUSTOMER, 'booking-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin payment initiation on any booking', async () => {
      await expect(
        service.assertCanInitiatePayment('admin-1', Role.ADMIN, 'booking-2'),
      ).resolves.toBeUndefined();
    });
  });
});
