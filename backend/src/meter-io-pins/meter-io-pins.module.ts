import { Module } from '@nestjs/common';
import { MeterIoPinsRepository } from './meter-io-pins.repository';
import { MeterIoPinsService } from './meter-io-pins.service';

/**
 * Module for meter I/O pin configuration — the app-owned replacement for the
 * energy manager's Excel sheet.
 *
 * Exposes {@link MeterIoPinsService} for other modules (e.g. meters, work-logs)
 * to read pin data. Has no controllers of its own: the read endpoint is mounted
 * on the meters controller as `GET /api/meters/:ionDeviceName/pins` to keep the
 * route hierarchy meter-centric.
 */
@Module({
    providers: [MeterIoPinsService, MeterIoPinsRepository],
    exports: [MeterIoPinsService],
})
export class MeterIoPinsModule {

}
