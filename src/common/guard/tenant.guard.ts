import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * TenantGuard enforces multi-tenancy isolation.
 * 
 * Rules:
 * - SUPERADMIN and ADMIN can access any tenant (bypass)
 * - All other users MUST have a tenantId
 * - Users can only access data from their own tenant
 * - If tenantId is missing, access is denied
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public (skip tenant check)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // If no user, let JWT guard handle it
      return true;
    }

    // Platform admins can bypass tenant check
    if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
      // Allow but log for audit
      this.logger.debug(`Admin ${user.id} accessing tenant: ${user.tenantId || 'all'}`);
      return true;
    }

    // All other users MUST have a tenantId
    const tenantId = user.tenantId || user.orgId;

    if (!tenantId) {
      this.logger.warn(`User ${user.id} attempted access without tenantId`);
      throw new ForbiddenException(
        'Tenant ID is required. Please ensure you are associated with an organization.',
      );
    }

    // Attach tenantId to request for use in services
    request.tenantId = tenantId;
    request.user.tenantId = tenantId;

    return true;
  }
}
