import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // or your local enum

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

///This lets you tag a route with the roles it needs.

///Technical Explanation
///Metadata() is a NestJS helper that lets you attach data (metadata) to route handlers.
//ROLES_KEY will be used by the guard to read which roles are allowed.
