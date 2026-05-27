// ArcGIS sync stub. Checks whether the API key is configured and logs presence only.
// NEVER logs the key value — it is a credential.
// Real implementation: single HTTPS GET to the PME_Meters FeatureServer,
// then UPDATE meters WHERE arcgis_object_id matches.
// See specs/02-integration-architecture.md for the full request + error handling.
// Note: ArcGIS returns HTTP 200 even on error — always inspect the response body.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';

@Injectable()
export class ArcGisSyncService {
    private readonly logger = new Logger(ArcGisSyncService.name);

    constructor(private readonly config: ConfigService<Env, true>) {}

    async run(): Promise<void> {
        const keyPresent = !!this.config.get('ARCGIS_API_KEY', { infer: true });

        this.logger.log(
            { arcgisApiKeyPresent: keyPresent },
            'ArcGIS sync: not yet implemented — API key ' +
                (keyPresent ? 'is present' : 'is MISSING — sync will fail when implemented'),
        );

        // TODO: GET [BASE_URL]/query?where=1=1&outFields=...&outSR=4326&f=json&token=ARCGIS_API_KEY
        // Inspect response body for error.code before processing features.
        // UPDATE meters SET building_location, lat, lon, digital_input, arcgis_synced_at
        // WHERE arcgis_object_id = feature.attributes.OBJECTID.
    }
}
