// Raw SQL queries against the meters cache table.
// All meter picker requests are served from here — no PME or ArcGIS call at request time.

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

export interface MeterRow {
    ion_device_name: string;            // universal join key (ION_Network.Device.Name = ION_Data.Source.Name): e.g. '01.01E1', '11.11M1'
    pme_display_name: string | null;    // name displayed to workers in the UI (ION_Data.Source.DisplayName)
    ion_location: string | null;        // rich description of location string (ION_Network.Device.Description): e.g. 'University Hall 01-E1, Room B136A'
    hardware_model: string | null;      // hardware model for meter (ION_Network.DeviceType.DisplayName): e.g. '7700', 'PM5560'
    building_location: string | null;   // ArcGIS building location (ArcGIS Building_Location): e.g. 'Bldg 1- B136A'
    digital_input: string | null;       // I/O type string (ArcGIS Digital_Input): e.g. 'Electricity; D1 - Steam; D2 - Chilledwater'
    lat: string | null;                 // latitude
    lon: string | null;                 // longitude
    arcgis_object_id: number | null;
}

@Injectable()
export class MetersRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

    // Returns all enabled meters ordered by display name — the full meter picker dataset.
    // 135 rows max; no pagination needed.
    async getAllMeters(): Promise<MeterRow[]> {
        const result = await this.pool.query<MeterRow>(`
            SELECT
                ion_device_name,
                pme_display_name,
                ion_location,
                hardware_model,
                building_location,
                digital_input,
                lat,
                lon,
                arcgis_object_id
            FROM meters
            WHERE enabled = true
            ORDER BY pme_display_name
        `);
        return result.rows;
    }
}
