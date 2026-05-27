// Raw SQL queries against the meters cache table.
// All meter picker requests are served from here — no PME or ArcGIS call at request time.

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

/**
 * Slim meter shape returned by the picker list endpoint. Drops sync timestamps
 * and admin-managed fields that the worker form doesn't need.
 */
export interface MeterListRow {
    ionDeviceName: string;
    pmeDisplayName: string | null;
    arcgisMeterId: string | null;
    buildingLocation: string | null;
    hardwareModel: string | null;
    lat: string | null;
    lon: string | null;
}

/**
 * Full meter detail shape returned by the single-meter endpoint. Extends the
 * list shape with location, admin-managed fields, and sync timestamps.
 */
export interface MeterDetailRow extends MeterListRow {
    ionLocation: string | null;
    meterIpAddress: string | null;
    serialNumber: string | null;
    arcgisSyncedAt: Date | null;
    pmeSyncedAt: Date | null;
}

@Injectable()
export class MetersRepository {

    constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

    /**
     * Fetches every enabled meter for the worker form's picker dropdown.
     *
     * @returns Up to 135 rows (the full in-scope meter set), sorted by
     *          `pme_display_name`. Disabled (decommissioned) meters are excluded.
     */
    async findAllEnabled(): Promise<MeterListRow[]> {
        const result = await this.pool.query<MeterListRow>(`
            SELECT
                ion_device_name   AS "ionDeviceName",
                pme_display_name  AS "pmeDisplayName",
                arcgis_meter_id   AS "arcgisMeterId",
                building_location AS "buildingLocation",
                hardware_model    AS "hardwareModel",
                lat,
                lon
            FROM meters
            WHERE enabled = true
            ORDER BY pme_display_name
        `);
        return result.rows;
    }

    /**
     * Fetches the full detail row for one meter, including admin-managed fields
     * and sync timestamps.
     *
     * @param ionDeviceName - The PME canonical device name (the table PK).
     * @returns The meter row, or `null` if no meter exists with that name.
     *          Returns disabled meters too — the caller decides whether to surface them.
     */
    async findByIonDeviceName(ionDeviceName: string): Promise<MeterDetailRow | null> {
        const result = await this.pool.query<MeterDetailRow>(
            `
            SELECT
                ion_device_name   AS "ionDeviceName",
                pme_display_name  AS "pmeDisplayName",
                arcgis_meter_id   AS "arcgisMeterId",
                building_location AS "buildingLocation",
                hardware_model    AS "hardwareModel",
                ion_location      AS "ionLocation",
                meter_ip_address  AS "meterIpAddress",
                serial_number     AS "serialNumber",
                lat,
                lon,
                arcgis_synced_at  AS "arcgisSyncedAt",
                pme_synced_at     AS "pmeSyncedAt"
            FROM meters
            WHERE ion_device_name = $1
            `,
            [ionDeviceName],
        );
        return result.rows[0] ?? null;
    }

    /**
     * Cheap existence check used by routes that need to 404 before doing more
     * work (e.g. the pins endpoint, the work-log create path).
     *
     * @param ionDeviceName - The PME canonical device name.
     * @returns `true` if a meter row exists with that name; `false` otherwise.
     */
    async exists(ionDeviceName: string): Promise<boolean> {
        const result = await this.pool.query<{ exists: boolean }>(
            `SELECT EXISTS(SELECT 1 FROM meters WHERE ion_device_name = $1) AS "exists"`,
            [ionDeviceName],
        );
        return result.rows[0]?.exists ?? false;
    }
}
