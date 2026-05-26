// Meter cache API. Real implementation lands in Step 6 once the pg pool +
// migrations are in place; stubs here so the route surface is testable today.

import { Controller, Get, NotImplementedException, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meters')
@UseGuards(JwtAuthGuard)
export class MetersController {
  @Get()
  list(): never {
    throw new NotImplementedException('GET /api/meters — implemented in Step 6');
  }

  @Get(':ionDeviceName')
  one(@Param('ionDeviceName') _name: string): never {
    throw new NotImplementedException('GET /api/meters/:ionDeviceName — implemented in Step 6');
  }
}
