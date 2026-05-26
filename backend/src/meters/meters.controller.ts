// Meter cache API. Serves the full meter list for the worker form's building/meter picker.
// All data is read from WorkLog's own DB — no PME or ArcGIS call at request time.

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetersService } from './meters.service';

@Controller('meters')
@UseGuards(JwtAuthGuard)
export class MetersController {
    constructor(private readonly meters: MetersService) {}

    @Get()
    async list() {
        return this.meters.getAllMeters();
    }
}
