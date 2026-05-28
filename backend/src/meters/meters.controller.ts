// Meter cache API. Serves the picker list, single-meter detail, and per-meter I/O pins.
// All data is read from WorkLog's own DB — no PME or ArcGIS call at request time.

import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeterIoPinsService } from '../meter-io-pins/meter-io-pins.service';
import { MetersService } from './meters.service';

/**
 * REST surface for meter lookup. Mounted at `/api/meters`. All routes require
 * an authenticated user; both technician and admin roles are accepted.
 */
@Controller('meters')
@UseGuards(JwtAuthGuard)
export class MetersController {

    constructor(
        private readonly meters: MetersService,
        private readonly pins: MeterIoPinsService,
    ) {}

    /**
     * `GET /api/meters` — full enabled-meter list for the picker.
     *
     * @returns Up to 135 meter rows, sorted by display name.
     */
    @Get()
    list() {
        return this.meters.listEnabled();
    }

    /**
     * `GET /api/meters/:ionDeviceName` — single meter detail.
     *
     * @param ionDeviceName - The PME canonical device name, from the URL path.
     * @returns The meter detail row.
     * @throws NotFoundException (404) if the meter does not exist.
     */
    @Get(':ionDeviceName')
    getOne(@Param('ionDeviceName') ionDeviceName: string) {
        return this.meters.getByIonDeviceName(ionDeviceName);
    }

    /**
     * `GET /api/meters/:ionDeviceName/pins` — I/O pin configuration for a meter.
     *
     * @param ionDeviceName - The PME canonical device name, from the URL path.
     * @returns The pins for the meter, ordered for display. Empty array is a
     *          valid response and means "meter exists but has no pins configured"
     *          (electricity-only meters).
     * @throws NotFoundException (404) if the meter itself does not exist —
     *         distinct from the empty-array case above.
     */
    @Get(':ionDeviceName/pins')
    async getPins(@Param('ionDeviceName') ionDeviceName: string) {
        if (!(await this.meters.exists(ionDeviceName))) {
            throw new NotFoundException(`Meter not found: ${ionDeviceName}`);
        }
        return this.pins.findByDevice(ionDeviceName);
    }
}
