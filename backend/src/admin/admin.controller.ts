// Admin-only endpoints. Protected by JwtAuthGuard + RolesGuard('admin').
// Currently exposes a manual sync trigger; expands later for user/meter management.

import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SyncService } from '../sync/sync.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private readonly sync: SyncService) {}

    @Post('sync')
    @HttpCode(HttpStatus.ACCEPTED)
    async triggerSync() {
        await this.sync.runDailySync();
        return { message: 'Sync triggered', timestamp: new Date().toISOString() };
    }
}
