import { Module } from '@nestjs/common';
import { MeterIoPinsModule } from '../meter-io-pins/meter-io-pins.module';
import { MetersController } from './meters.controller';
import { MetersRepository } from './meters.repository';
import { MetersService } from './meters.service';

/**
 * Meters module — owns the picker list, single-meter detail, and (via a
 * delegated service) the per-meter pins endpoint.
 *
 * Imports {@link MeterIoPinsModule} to mount `GET /api/meters/:ionDeviceName/pins`
 * on this controller without duplicating the pin route under a separate base path.
 * Exports {@link MetersService} so other modules (e.g. work-logs) can validate
 * meter existence cheaply.
 */
@Module({
    imports: [MeterIoPinsModule],
    controllers: [MetersController],
    providers: [MetersService, MetersRepository],
    exports: [MetersService],
})
export class MetersModule {

}
