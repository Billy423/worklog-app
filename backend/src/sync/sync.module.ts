import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PmeSyncService } from './pme-sync.service';
import { ArcGisSyncService } from './arcgis-sync.service';

@Module({
    providers: [SyncService, PmeSyncService, ArcGisSyncService],
    exports: [SyncService],
})
export class SyncModule {}
