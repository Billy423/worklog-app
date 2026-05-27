// Orchestrates the daily PME + ArcGIS sync. Runs on @Cron('0 2 * * *') (2 AM daily)
// and can be triggered manually via POST /api/admin/sync.

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PmeSyncService } from './pme-sync.service';
import { ArcGisSyncService } from './arcgis-sync.service';
import type { Env } from '../config/env.schema';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private readonly pme: PmeSyncService,
        private readonly arcgis: ArcGisSyncService,
        private readonly config: ConfigService<Env, true>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async runDailySync(): Promise<void> {
        const cron = this.config.get('SYNC_CRON', { infer: true });
        this.logger.log({ cron }, 'Daily sync starting');

        await this.pme.run();
        await this.arcgis.run();

        this.logger.log('Daily sync complete');
    }
}
