import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from '../../../src/common/guard/tenant.guard';
import { IS_PUBLIC_KEY } from '../../../src/common/decorators/public.decorator';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;
  let mockExecutionContext: Partial<ExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard, Reflector],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    reflector = module.get<Reflector>(Reflector);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  describe('Public routes', () => {
    it('should allow access to routes marked with @Public()', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const request = { user: null };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('Admin users', () => {
    it('should allow SUPERADMIN to bypass tenant check', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const request = {
        user: {
          id: 'admin-1',
          role: 'SUPERADMIN',
          tenantId: null,
        },
      };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);
      expect(result).toBe(true);
      expect(request.tenantId).toBeUndefined(); // Admin bypass doesn't set tenantId
    });

    it('should allow ADMIN to bypass tenant check', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const request = {
        user: {
          id: 'admin-2',
          role: 'ADMIN',
          tenantId: null,
        },
      };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('Regular users', () => {
    it('should allow access when user has tenantId', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const request = {
        user: {
          id: 'user-1',
          role: 'CUSTOMER',
          tenantId: 'tenant-123',
        },
      };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);
      expect(result).toBe(true);
      expect(request.tenantId).toBe('tenant-123');
      expect(request.user.tenantId).toBe('tenant-123');
    });

    it('should allow access when user has orgId (fallback to tenantId)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const request = {
        user: {
          id: 'user-2',
          role: 'MECHANIC',
          orgId: 'org-456',
        },
      };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);
      expect(result).toBe(true);
      expect(request.tenantId).toBe('org-456');
    });

    it('should throw ForbiddenException when user has no tenantId or orgId', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const request = {
        user: {
          id: 'user-3',
          role: 'CUSTOMER',
          tenantId: null,
          orgId: null,
        },
      };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        'Tenant ID is required. Please ensure you are associated with an organization.',
      );
    });
  });

  describe('Unauthenticated requests', () => {
    it('should allow access when no user (let JWT guard handle it)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const request = { user: null };
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(request);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);
      expect(result).toBe(true);
    });
  });
});
