// Work log entries — the core write surface. Stubbed until requirements
// (work-type taxonomy, photo upload, etc.) are finalised post-MVP1.

import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('work-logs')
@UseGuards(JwtAuthGuard)
export class WorkLogsController {
  @Get()
  list(): never {
    throw new NotImplementedException('GET /api/work-logs — pending requirements');
  }

  @Post()
  create(@Body() _body: unknown): never {
    throw new NotImplementedException('POST /api/work-logs — pending requirements');
  }
}
