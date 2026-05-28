import { Module } from '@nestjs/common';
import { MeterIoPinsModule } from '../meter-io-pins/meter-io-pins.module';
import { MetersModule } from '../meters/meters.module';
import { WorkLogsController } from './work-logs.controller';
import { WorkLogsRepository } from './work-logs.repository';
import { WorkLogsService } from './work-logs.service';

/**
 * Work-logs module — submission and listing of work-log entries.
 *
 * Imports {@link MetersModule} and {@link MeterIoPinsModule} for create-time
 * validation (meter existence, pinId membership). Does not export anything —
 * no other module currently needs to read or write work-log entries.
 */
@Module({
    imports: [MetersModule, MeterIoPinsModule],
    controllers: [WorkLogsController],
    providers: [WorkLogsService, WorkLogsRepository],
})
export class WorkLogsModule {}
