// Work log entries — the core write surface for field workers.

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/user';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { ListWorkLogsQueryDto } from './dto/list-work-logs.dto';
import { WorkLogsService } from './work-logs.service';

/**
 * REST surface for work-log entries. Mounted at `/api/work-logs`. All routes
 * require an authenticated user; RBAC scoping (technician-own-only vs admin-all)
 * is applied by the service, not here.
 */
@Controller('work-logs')
@UseGuards(JwtAuthGuard)
export class WorkLogsController {
    constructor(private readonly service: WorkLogsService) {}

    /**
     * `GET /api/work-logs` — paginated list of entries.
     *
     * @param query - Filters and pagination from the query string (validated
     *                by the global ValidationPipe against {@link ListWorkLogsQueryDto}).
     * @param user - Authenticated caller from the JWT.
     * @returns `{ data, total, page, limit }`. `data` is scoped by role:
     *          technicians see only their own entries; admins see all.
     */
    @Get()
    list(@Query() query: ListWorkLogsQueryDto, @CurrentUser() user: AuthenticatedUser) {
        return this.service.list(query, user);
    }

    /**
     * `POST /api/work-logs` — submit a new work-log entry.
     *
     * @param dto - Submission body (meter, pins, notes), validated against
     *              {@link CreateWorkLogDto}.
     * @param user - Authenticated caller from the JWT; supplies userOid + userEmail.
     * @returns The persisted row with server-assigned id and timestamps.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateWorkLogDto, @CurrentUser() user: AuthenticatedUser) {
        return this.service.create(dto, user);
    }
}
