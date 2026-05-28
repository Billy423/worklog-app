import { ArrayMaxSize, IsArray, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Request body for `POST /api/work-logs`. Shape validation only — semantic
 * validation (meter exists, pinIds belong to that meter) lives in the service.
 */
export class CreateWorkLogDto {
    /** Target meter (PME canonical device name). */
    @IsString()
    @MaxLength(200)
    meterIonDeviceName!: string;

    /**
     * Pin IDs the worker reported having worked on. May be empty for
     * electricity-only meters. Validated against the meter's current
     * `meter_io_pins` rows in the service layer — intentionally not a DB FK so
     * future pin renames or deletes do not affect historical entries.
     */
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @MaxLength(20, { each: true })
    pinIds: string[] = [];

    /** Free-text description of the work performed. Optional. */
    @IsOptional()
    @IsString()
    notes?: string;

    /**
     * When the work was actually performed (ISO 8601). Optional — defaults to
     * server time at insert. Offline clients replaying a queued entry supply the
     * original timestamp so `logged_at` reflects when the work happened, not when
     * the network reconnected.
     */
    @IsOptional()
    @IsISO8601()
    loggedAt?: string;
}
