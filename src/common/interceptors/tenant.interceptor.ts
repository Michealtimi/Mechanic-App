import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * TenantInterceptor automatically adds tenantId to Prisma query options.
 * This ensures all database queries are scoped to the user's tenant.
 * 
 * Usage: Add to global interceptors or specific controllers.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Skip if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId || user?.tenantId || user?.orgId;

    // Platform admins can access all tenants (no filtering)
    if (user && (user.role === 'SUPERADMIN' || user.role === 'ADMIN')) {
      // Don't filter by tenant for admins
      return next.handle();
    }

    // Attach tenantId to request for services to use
    if (tenantId) {
      request.tenantId = tenantId;
      this.logger.debug(`TenantInterceptor: Scoping request to tenant ${tenantId}`);
    } else if (user) {
      // User exists but no tenantId - this should be caught by TenantGuard
      this.logger.warn(`TenantInterceptor: User ${user.id} has no tenantId`);
    }

    return next.handle();
  }
}
