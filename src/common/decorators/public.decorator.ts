import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as public (skip tenant and role checks).
 * Use sparingly - only for truly public endpoints like health checks.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
