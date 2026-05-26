// Owns the Postgres connection pool. Global so repositories anywhere can inject it.
// Uses raw `pg` Pool — no ORM. Repositories write plain SQL queries.
//
// Inject the pool in a repository with:
//   constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { Env } from '../config/env.schema';

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
    providers: [
        {
            provide: PG_POOL,
            useFactory: (config: ConfigService<Env, true>): Pool => {
                return new Pool({
                    connectionString: config.get('DATABASE_URL', { infer: true }),
                    // Small pool — WorkLog is low-concurrency (10–15 users).
                    max: 10,
                    idleTimeoutMillis: 30_000,
                    connectionTimeoutMillis: 5_000,
                });
            },
            inject: [ConfigService],
        },
    ],
    exports: [PG_POOL],
})
export class DatabaseModule {}
