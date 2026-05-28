// Raw SQL access for work_log_entries. Entries are immutable in MVP — only insert and
// list operations are supported here.

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

/**
 * Single work-log entry as returned by the create path. Mirrors the
 * `work_log_entries` table columns in camelCase.
 */
export interface WorkLogEntryRow {
    id: string;
    meterIonDeviceName: string;
    userOid: string;
    userEmail: string;
    pinIds: string[];
    notes: string | null;
    loggedAt: Date;
    createdAt: Date;
}

/**
 * Slim work-log shape returned by the list endpoint. Joins through to
 * `meters.pme_display_name` for display so the client doesn't need a second
 * round-trip per row; drops audit fields (userOid, createdAt) the list view
 * doesn't render.
 */
export interface WorkLogListItem {
    id: string;
    meterIonDeviceName: string;
    meterDisplayName: string | null;
    userEmail: string;
    pinIds: string[];
    notes: string | null;
    loggedAt: Date;
}

/**
 * Filters and pagination accepted by {@link WorkLogsRepository.list}.
 * `scopeToUserOid`, when set, enforces RBAC scoping — pass the caller's oid
 * for the technician role; omit for admins.
 */
export interface ListWorkLogsFilters {
    meterId?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
    // If set, restricts to entries owned by this Azure AD oid (technician scoping).
    scopeToUserOid?: string;
}

/**
 * Payload accepted by {@link WorkLogsRepository.insert}. Identity fields
 * (userOid, userEmail) come from the JWT at the controller/service layer —
 * the repository does not look at request context.
 */
export interface CreateWorkLogInput {
    meterIonDeviceName: string;
    userOid: string;
    userEmail: string;
    pinIds: string[];
    notes?: string;
}

@Injectable()
export class WorkLogsRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

    /**
     * Inserts one work-log entry and returns the persisted row (with the
     * server-assigned id and timestamps).
     *
     * @param input - Validated fields for the new entry.
     * @returns The inserted row in camelCase.·
     */
    async insert(input: CreateWorkLogInput): Promise<WorkLogEntryRow> {
        const result = await this.pool.query<WorkLogEntryRow>(
            `
            INSERT INTO work_log_entries
                (meter_ion_device_name, user_oid, user_email, pin_ids, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                meter_ion_device_name AS "meterIonDeviceName",
                user_oid              AS "userOid",
                user_email            AS "userEmail",
                pin_ids               AS "pinIds",
                notes,
                logged_at             AS "loggedAt",
                created_at            AS "createdAt"
            `,
            [
                input.meterIonDeviceName,
                input.userOid,
                input.userEmail,
                input.pinIds,
                input.notes ?? null,
            ],
        );
        return result.rows[0];
    }

    /**
     * Lists work-log entries with optional filters and pagination. RBAC scoping
     * (technician-sees-own-only) is applied here when `filters.scopeToUserOid`
     * is set — the caller (service layer) decides whether to scope.
     *
     * @param filters - Filters, page, limit, and optional RBAC scope.
     * @returns A page of rows ordered by `loggedAt DESC`, plus the total row
     *          count matching the filters (for pagination metadata).
     */
    async list(filters: ListWorkLogsFilters): Promise<{ data: WorkLogListItem[]; total: number }> {
        const where: string[] = [];
        const params: unknown[] = [];
        let p = 0;

        if (filters.scopeToUserOid !== undefined) {
            params.push(filters.scopeToUserOid);
            where.push(`w.user_oid = $${++p}`);
        }
        if (filters.meterId) {
            params.push(filters.meterId);
            where.push(`w.meter_ion_device_name = $${++p}`);
        }
        if (filters.from) {
            params.push(filters.from);
            where.push(`w.logged_at >= $${++p}`);
        }
        if (filters.to) {
            params.push(filters.to);
            where.push(`w.logged_at <= $${++p}`);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const offset = (filters.page - 1) * filters.limit;

        const totalResult = await this.pool.query<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM work_log_entries w ${whereSql}`,
            params,
        );
        const total = Number(totalResult.rows[0]?.count ?? '0');

        params.push(filters.limit);
        const limitIdx = ++p;
        params.push(offset);
        const offsetIdx = ++p;

        const result = await this.pool.query<WorkLogListItem>(
            `
            SELECT
                w.id,
                w.meter_ion_device_name AS "meterIonDeviceName",
                m.pme_display_name      AS "meterDisplayName",
                w.user_email            AS "userEmail",
                w.pin_ids               AS "pinIds",
                w.notes,
                w.logged_at             AS "loggedAt"
            FROM work_log_entries w
            LEFT JOIN meters m ON m.ion_device_name = w.meter_ion_device_name
            ${whereSql}
            ORDER BY w.logged_at DESC
            LIMIT $${limitIdx} OFFSET $${offsetIdx}
            `,
            params,
        );

        return { data: result.rows, total };
    }
}
