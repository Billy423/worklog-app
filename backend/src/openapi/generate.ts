// Build-time OpenAPI exporter. Bootstraps the Nest app WITHOUT starting the HTTP listener,
// introspects route metadata, and writes docs/openapi.yaml. The app is never started or
// queried, so the placeholder env below is safe — it only satisfies boot-time validation.
//
// Run via `npm run generate:openapi` (after `npm run build`). CI regenerates and diffs the
// committed file to catch spec drift.

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { stringify } from 'yaml';
import { AppModule } from '../app.module';
import { buildOpenApiConfig } from './config';

process.env.NODE_ENV ??= 'development';
process.env.AUTH_BYPASS ??= 'true';
process.env.DATABASE_URL ??= 'postgresql://openapi:openapi@localhost:5432/openapi';

async function generate(): Promise<void> {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
    await app.close();

    const outDir = join(process.cwd(), 'docs');
    mkdirSync(outDir, { recursive: true });
    const outFile = join(outDir, 'openapi.yaml');
    writeFileSync(outFile, stringify(document));

    process.stdout.write(`Wrote ${outFile}\n`);
}

void generate();
