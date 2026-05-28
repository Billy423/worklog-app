// ArcGIS sync. Single HTTPS request fetches all 135 in-scope meter features and updates
// the meters cache. Matches meters by arcgis_object_id (set at seed time).
//
// Column ownership (this service):
//   WRITES: arcgis_meter_id, building_location, digital_input, serial_number, lat, lon,
//           arcgis_synced_at
//   NEVER WRITES: meter_ip_address (app-owned), meter_io_pins.* (app-owned), any PME column.
//
// ArcGIS returns HTTP 200 even on errors — the response body must be inspected for
// an `error` object before processing features.

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { Env } from '../config/env.schema';
import { PG_POOL } from '../database/database.module';

const ARCGIS_FEATURE_SERVER =
    'https://services.arcgis.com/ytrmkEwaAd1uBvPy/arcgis/rest/services/PME_Meters/FeatureServer/0';

const OUT_FIELDS = ['OBJECTID', 'Meter_ID', 'Building_Location', 'Digital_Input', 'Serial_Number'];

interface ArcGisFeature {
    attributes: {
        OBJECTID: number;
        Meter_ID: string | null;
        Building_Location: string | null;
        Digital_Input: string | null;
        Serial_Number: string | null;
    };
    geometry?: { x: number; y: number };
}

interface ArcGisResponse {
    features?: ArcGisFeature[];
    error?: { code: number; message: string };
}

@Injectable()
export class ArcGisSyncService {
    private readonly logger = new Logger(ArcGisSyncService.name);

    constructor(
        private readonly config: ConfigService<Env, true>,
        @Inject(PG_POOL) private readonly pool: Pool,
    ) {}

    async run(): Promise<void> {
        const apiKey = this.config.get('ARCGIS_API_KEY', { infer: true });
        if (!apiKey) {
            this.logger.warn('ARCGIS_API_KEY missing — skipping ArcGIS sync');
            return;
        }

        const url = this.buildQueryUrl(apiKey);
        let body: ArcGisResponse;
        try {
            const res = await fetch(url);
            body = (await res.json()) as ArcGisResponse;
        } catch (err) {
            this.logger.error({ err }, 'ArcGIS request failed');
            return;
        }

        if (body.error) {
            this.logger.error(
                { code: body.error.code, message: body.error.message },
                'ArcGIS returned error in response body',
            );
            return;
        }

        const features = body.features ?? [];
        if (features.length === 0) {
            this.logger.warn('ArcGIS sync: no features returned');
            return;
        }

        const updated = await this.upsertFeatures(features);
        this.logger.log({ fetched: features.length, updated }, 'ArcGIS sync complete');
    }

    private buildQueryUrl(apiKey: string): string {
        const params = new URLSearchParams({
            where: '1=1',
            outFields: OUT_FIELDS.join(','),
            returnGeometry: 'true',
            outSR: '4326',
            f: 'json',
            token: apiKey,
        });
        return `${ARCGIS_FEATURE_SERVER}/query?${params.toString()}`;
    }

    private async upsertFeatures(features: ArcGisFeature[]): Promise<number> {
        let updated = 0;
        for (const f of features) {
            const a = f.attributes;
            // Only update meters that already exist (matched by ArcGIS OBJECTID set at
            // seed time). We do NOT insert new rows from ArcGIS — meters require PME data
            // to be useful, and PME sync owns insertion.
            const result = await this.pool.query(
                `
                UPDATE meters SET
                    arcgis_meter_id   = $2,
                    building_location = $3,
                    digital_input     = $4,
                    serial_number     = $5,
                    lat               = $6,
                    lon               = $7,
                    arcgis_synced_at  = NOW(),
                    updated_at        = NOW()
                WHERE arcgis_object_id = $1
                `,
                [
                    a.OBJECTID,
                    a.Meter_ID,
                    a.Building_Location,
                    a.Digital_Input,
                    a.Serial_Number,
                    f.geometry?.y ?? null,
                    f.geometry?.x ?? null,
                ],
            );
            if (result.rowCount && result.rowCount > 0) updated++;
        }
        return updated;
    }
}
