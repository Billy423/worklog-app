// Public liveness endpoint for Azure App Service / load balancer probes.
// No auth — must be reachable without a token.

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
