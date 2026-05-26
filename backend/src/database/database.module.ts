// Owns the Postgres connection pool. Global so repositories anywhere can inject it.
// Stub here — pg Pool + DI provider land in Step 6 alongside the first migration.

import { Global, Module } from '@nestjs/common';

// Stub. The real pg Pool provider lands in Step 6.
@Global()
@Module({})
export class DatabaseModule {}
