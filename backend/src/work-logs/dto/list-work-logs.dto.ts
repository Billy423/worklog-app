import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Query-string parameters accepted by `GET /api/work-logs`. All fields are
 * optional; `page` defaults to 1 and `limit` defaults to 50 (max 200).
 *
 * RBAC scoping (technician-own-only vs admin-all) is applied by the service
 * from the authenticated user — it is NOT a query parameter callers can set.
 */
export class ListWorkLogsQueryDto {
    /** Filter to entries against this meter (PME canonical device name). */
    @ApiPropertyOptional({
        description: 'Filter to entries against this meter (PME canonical device name).',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    meterId?: string;

    /** Lower bound on `logged_at` (ISO 8601). */
    @ApiPropertyOptional({
        description: 'Lower bound on logged_at (ISO 8601).',
        format: 'date-time',
    })
    @IsOptional()
    @IsISO8601()
    from?: string;

    /** Upper bound on `logged_at` (ISO 8601). */
    @ApiPropertyOptional({
        description: 'Upper bound on logged_at (ISO 8601).',
        format: 'date-time',
    })
    @IsOptional()
    @IsISO8601()
    to?: string;

    /** 1-indexed page number. */
    @ApiPropertyOptional({ description: '1-indexed page number.', minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    /** Page size; capped at 200 to bound memory. */
    @ApiPropertyOptional({
        description: 'Page size; capped at 200.',
        minimum: 1,
        maximum: 200,
        default: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit: number = 50;
}
