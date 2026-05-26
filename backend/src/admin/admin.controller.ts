// Admin-only endpoints. Protected by JwtAuthGuard + RolesGuard('admin').
// Currently exposes a manual sync trigger; expands later for user/meter management.

import { Controller, NotImplementedException, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  @Post('sync')
  triggerSync(): never {
    throw new NotImplementedException('POST /api/admin/sync — implemented in Step 7');
  }
}
