// Shared OpenAPI document config. Used by both the dev-only Swagger UI in main.ts and
// the build-time `generate:openapi` script, so the served docs and the committed
// docs/openapi.yaml are generated from a single source and cannot drift apart.

import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

// Version is read from npm_package_version (set whenever the app is launched via an npm
// script — both `start:dev` and `generate:openapi` qualify). Importing package.json
// directly would pull a file outside src/ and shift nest build's output layout.
export function buildOpenApiConfig(): Omit<OpenAPIObject, 'paths'> {
    return new DocumentBuilder()
        .setTitle('WorkLog API')
        .setDescription('REST API for the McMaster Facility Services WorkLog application.')
        .setVersion(process.env.npm_package_version ?? '0.0.0')
        .build();
}
