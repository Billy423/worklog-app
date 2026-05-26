// Enforces @Roles(...) metadata. Pairs with JwtAuthGuard (which populates req.user).

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser, Role } from '../types/user';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0) return true;

        const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
        const user = req.user;
        if (!user) throw new ForbiddenException('No authenticated user');

        const ok = required.some((r) => user.roles.includes(r));
        if (!ok) {
            throw new ForbiddenException(`Requires one of roles: ${required.join(', ')}`);
        }
        return true;
    }
}
