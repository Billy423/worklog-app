// PME sync stub. Reads PME connection env vars and logs intent only.
// Real implementation: cross-DB SQL query against ION_Network + ION_Data,
// then UPSERT into the meters table. Requires Windows Auth (Kerberos/NTLM)
// support from the mssql driver on Linux — must be validated before going live.
// See specs/02-integration-architecture.md for the full query.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';

@Injectable()
export class PmeSyncService {
    private readonly logger = new Logger(PmeSyncService.name);

    constructor(private readonly config: ConfigService<Env, true>) {}

    async run(): Promise<void> {
        const host = this.config.get('PME_HOST', { infer: true });
        const instance = this.config.get('PME_INSTANCE', { infer: true });
        const user = this.config.get('PME_USER', { infer: true });
        const windowsAuth = this.config.get('PME_WINDOWS_AUTH', { infer: true });

        this.logger.log(
            {
                host: host ?? '(not set)',
                instance: instance ?? '(not set)',
                user: user ?? '(not set)',
                windowsAuth,
            },
            'PME sync: not yet implemented — connection config present',
        );

        // TODO: open mssql connection to PFSPMEDB01\ION, run cross-DB query,
        // UPSERT into meters (ion_device_name as conflict key), update pme_synced_at.
    }
}
