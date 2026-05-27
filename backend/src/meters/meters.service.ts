import { Injectable, NotFoundException } from '@nestjs/common';
import { MeterDetailRow, MeterListRow, MetersRepository } from './meters.repository';

/**
 * Application-facing access to the meters cache. Owns "404 if missing" semantics
 * so controllers stay thin and other services (e.g. work-logs) can call `exists`
 * cheaply for validation.
 */
@Injectable()
export class MetersService {

    constructor(private readonly repo: MetersRepository) {}

    /**
     * Returns the picker dataset of all enabled meters.
     *
     * @returns Up to 135 meter rows, sorted by `pme_display_name`.
     */
    listEnabled(): Promise<MeterListRow[]> {
        return this.repo.findAllEnabled();
    }

    /**
     * Returns the full detail row for a single meter, raising 404 if missing.
     *
     * @param ionDeviceName - The PME canonical device name.
     * @returns The meter detail row.
     * @throws NotFoundException when no meter exists with that name.
     */
    async getByIonDeviceName(ionDeviceName: string): Promise<MeterDetailRow> {
        const row = await this.repo.findByIonDeviceName(ionDeviceName);
        if (!row) throw new NotFoundException(`Meter not found: ${ionDeviceName}`);
        return row;
    }

    /**
     * Existence check intended for callers that already plan to 404 or 400 on
     * their own (e.g. the work-log create path validating its `meterIonDeviceName`).
     *
     * @param ionDeviceName - The PME canonical device name.
     * @returns `true` if the meter exists, `false` otherwise.
     */
    exists(ionDeviceName: string): Promise<boolean> {
        return this.repo.exists(ionDeviceName);
    }
}
