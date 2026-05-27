// @Roles('admin') marks a route as requiring one of the listed roles.
// Enforced by RolesGuard (which must be applied alongside JwtAuthGuard).

import { SetMetadata } from '@nestjs/common';
import type { Role } from '../types/user';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
