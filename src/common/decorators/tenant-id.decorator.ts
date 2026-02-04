import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenantId from request.
 * Looks for tenantId in:
 * 1. Request user object (user.tenantId or user.orgId)
 * 2. Request headers (x-tenant-id)
 * 3. Request query params (tenantId)
 * 4. Request body (tenantId)
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Priority 1: From authenticated user
    if (user?.tenantId) {
      return user.tenantId;
    }
    if (user?.orgId) {
      return user.orgId;
    }

    // Priority 2: From header
    const headerTenantId = request.headers['x-tenant-id'];
    if (headerTenantId) {
      return headerTenantId;
    }

    // Priority 3: From query params
    if (request.query?.tenantId) {
      return request.query.tenantId;
    }

    // Priority 4: From body
    if (request.body?.tenantId) {
      return request.body.tenantId;
    }

    return undefined;
  },
);
