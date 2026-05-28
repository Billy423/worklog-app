import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/user';
import { MeterIoPinsService } from '../meter-io-pins/meter-io-pins.service';
import { MetersService } from '../meters/meters.service';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { ListWorkLogsQueryDto } from './dto/list-work-logs.dto';
import { WorkLogEntryRow, WorkLogsRepository } from './work-logs.repository';

/**
 * Business logic for work-log entries. Owns the two non-trivial behaviours:
 *
 *  1. Create-time validation: the target meter exists, and every submitted
 *     pinId currently belongs to that meter. Both checks live here (not as DB
 *     constraints) because `pin_ids` is a historical snapshot — a FK would
 *     either lose history on pin delete or block legitimate pin edits.
 *
 *  2. RBAC scoping on list: technicians see only their own entries; admins see
 *     everything. The scope is computed here from the JWT user, not by the
 *     controller, so other callers (future cron jobs, reports) can reuse the
 *     same policy without re-implementing it.
 */
@Injectable()
export class WorkLogsService {
    constructor(
        private readonly repo: WorkLogsRepository,
        private readonly meters: MetersService,
        private readonly pins: MeterIoPinsService,
    ) {}

    /**
     * Validates and persists a new work-log entry.
     *
     * @param dto - Client-supplied fields (meter, pins, notes). Already passed
     *              the global ValidationPipe — shape and types are trusted here.
     * @param user - Authenticated caller from the JWT. Supplies `userOid` and
     *               `userEmail` on the persisted row.
     * @returns The inserted row, including the server-assigned id and timestamps.
     * @throws NotFoundException (404) if `dto.meterIonDeviceName` doesn't exist.
     * @throws BadRequestException (400) if any `pinId` is not configured for
     *         the target meter, or if the user has no email claim on the JWT.
     */
    async create(dto: CreateWorkLogDto, user: AuthenticatedUser): Promise<WorkLogEntryRow> {
        if (!(await this.meters.exists(dto.meterIonDeviceName))) {
            throw new NotFoundException(`Meter not found: ${dto.meterIonDeviceName}`);
        }

        // Validate each submitted pin currently belongs to this meter. Controller-layer
        // guard only — pin_ids is stored as an array (not a FK), so future pin renames
        // or deletes do not retroactively affect this row.
        if (dto.pinIds.length > 0) {
            const valid = new Set(await this.pins.findPinIdsForDevice(dto.meterIonDeviceName));
            const unknown = dto.pinIds.filter((id) => !valid.has(id));
            if (unknown.length > 0) {
                throw new BadRequestException(
                    `Unknown pinId(s) for meter ${dto.meterIonDeviceName}: ${unknown.join(', ')}`,
                );
            }
        }

        if (!user.email) {
            throw new BadRequestException('Authenticated user has no email claim');
        }

        return this.repo.insert({
            meterIonDeviceName: dto.meterIonDeviceName,
            userOid: user.oid,
            userEmail: user.email,
            pinIds: dto.pinIds,
            notes: dto.notes,
            loggedAt: dto.loggedAt,
        });
    }

    /**
     * Lists work-log entries with RBAC scoping applied.
     *
     * Technicians are scoped to their own entries (by `user_oid`); admins see
     * all entries. If a user has both roles, admin wins (broader visibility).
     *
     * @param query - Filters and pagination from the query string.
     * @param user - Authenticated caller from the JWT.
     * @returns The page of entries plus pagination metadata.
     */
    async list(query: ListWorkLogsQueryDto, user: AuthenticatedUser) {
        const isAdmin = user.roles.includes('admin');
        const scopeToUserOid = isAdmin ? undefined : user.oid;

        const { data, total } = await this.repo.list({
            meterId: query.meterId,
            from: query.from,
            to: query.to,
            page: query.page,
            limit: query.limit,
            scopeToUserOid,
        });

        return { data, total, page: query.page, limit: query.limit };
    }
}
