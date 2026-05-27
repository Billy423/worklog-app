// Raw SQL access for meter_io_pins. App-owned, editable; never written by sync.

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

/**
 * One I/O channel on one meter, in the camelCase shape returned to API clients.
 *
 * Mirrors the `meter_io_pins` table columns (minus the `ion_device_name` FK and
 * sync timestamps, which the caller already knows or doesn't need on the wire).
 */
export interface MeterIoPinRow {
    id: number;
    pinId: string;
    utility: string;
    pinLabel: string | null;
    unit: string | null;
    displayOrder: number;
}

@Injectable()
export class MeterIoPinsRepository {

    constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

    /**
     * Fetches every configured I/O pin for a meter, ordered for display.
     *
     * @param ionDeviceName - The PME canonical device name (FK into `meters`).
     * @returns The pins for the meter, sorted by `display_order` then `pin_id`.
     *          Empty array if the meter has no pins configured (a valid state for
     *          electricity-only meters).
     */
    async findByDevice(ionDeviceName: string): Promise<MeterIoPinRow[]> {
        const result = await this.pool.query<MeterIoPinRow>(
            `
            SELECT
                id,
                pin_id        AS "pinId",
                utility,
                pin_label     AS "pinLabel",
                unit,
                display_order AS "displayOrder"
            FROM meter_io_pins
            WHERE ion_device_name = $1
            ORDER BY display_order, pin_id
            `,
            [ionDeviceName],
        );
        return result.rows;
    }

    /**
     * Lightweight lookup of just the pin_id strings configured for a meter.
     * Intended for fast controller-layer validation of work-log submissions —
     * avoids the cost of selecting and mapping all pin columns.
     *
     * @param ionDeviceName - The PME canonical device name.
     * @returns The pin_id strings for the meter, unordered.
     */
    async findPinIdsForDevice(ionDeviceName: string): Promise<string[]> {
        const result = await this.pool.query<{ pinId: string }>(
            `SELECT pin_id AS "pinId" FROM meter_io_pins WHERE ion_device_name = $1`,
            [ionDeviceName],
        );
        return result.rows.map((r) => r.pinId);
    }
}
