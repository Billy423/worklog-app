// Daily PME + ArcGIS sync. Stub now; Step 7 adds the real queries and the
// @Cron('0 2 * * *') schedule via @nestjs/schedule.

import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    // Real implementation lands in Step 7 — PME + ArcGIS sync + @Cron schedule.
    async runDailySync(): Promise<never> {
        this.logger.warn('SyncService.runDailySync — not yet implemented');
        throw new NotImplementedException('Daily sync not yet implemented (Step 7)');
    }
}
