// Build-time OpenAPI exporter. Bootstraps the Nest app WITHOUT starting the HTTP listener,
// introspects route metadata, and writes docs/openapi.yaml. The app is never started or
// queried.
//
// Run via `npm run generate:openapi` (after `npm run build`). CI regenerates and diffs the
// committed file to catch spec drift.

// MUST be the first import: sets placeholder env before AppModule is loaded, because
// AppModule's ConfigModule.forRoot validates process.env eagerly at import time.
import './env-defaults';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { stringify } from 'yaml';
import { AppModule } from '../app.module';
import { buildOpenApiConfig } from './config';

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

generate().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
