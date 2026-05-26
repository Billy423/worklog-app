// Injects the authenticated user into a controller method param.
// Only safe on routes protected by JwtAuthGuard — otherwise req.user is undefined.

import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!req.user) {
      throw new Error('CurrentUser used on an unguarded route');
    }
    return req.user;
  },
);
