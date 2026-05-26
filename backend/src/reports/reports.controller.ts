// Aggregations + multi-format export for admins/program managers. Post-MVP feature.

import { Controller, Get, NotImplementedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ReportsController {
  @Get()
  list(): never {
    throw new NotImplementedException('Reports — post-MVP');
  }
}
