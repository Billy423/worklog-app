import { Injectable } from '@nestjs/common';
import { MeterIoPinRow, MeterIoPinsRepository } from './meter-io-pins.repository';

/**
 * Application-facing access to a meter's I/O pin configuration.
 *
 * Thin pass-through over {@link MeterIoPinsRepository} for now — business logic
 * (e.g. utility normalisation, write-side validation when admin-edit lands) will
 * live here, not in the repository.
 */
@Injectable()
export class MeterIoPinsService {
    
    constructor(private readonly repo: MeterIoPinsRepository) {}

    /**
     * Returns the full pin list for a meter, ordered for UI display.
     *
     * @param ionDeviceName - The PME canonical device name.
     * @returns Pins ordered by `displayOrder` then `pinId`. Empty array if the
     *          meter has no pins configured (valid for electricity-only meters).
     */
    findByDevice(ionDeviceName: string): Promise<MeterIoPinRow[]> {
        return this.repo.findByDevice(ionDeviceName);
    }

    /**
     * Returns just the pin_id strings configured for a meter. Used by the
     * work-log create path to validate that each submitted `pinId` is a
     * currently-known pin for the target meter.
     *
     * @param ionDeviceName - The PME canonical device name.
     * @returns The configured pin_id strings, unordered.
     */
    findPinIdsForDevice(ionDeviceName: string): Promise<string[]> {
        return this.repo.findPinIdsForDevice(ionDeviceName);
    }
}
