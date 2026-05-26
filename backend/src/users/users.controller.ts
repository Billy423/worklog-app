// Echoes the authenticated user back. Useful for verifying the JWT/bypass
// pipeline end-to-end from the frontend.

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/user';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
