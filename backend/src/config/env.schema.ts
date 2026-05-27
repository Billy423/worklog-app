// Env var schema. Validated at boot via ConfigModule.forRoot({ validate }).
// Cross-field rules enforce: no AUTH_BYPASS in prod, Azure config present when not bypassing.

import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),

    CORS_ORIGIN: z.string().optional(),

    // Azure AD — required in production, optional in dev (covered by AUTH_BYPASS).
    AZURE_TENANT_ID: z.string().optional(),
    AZURE_CLIENT_ID: z.string().optional(),
    AZURE_AUDIENCE: z.string().optional(),

    // Dev bypass — must NEVER be true in production. Enforced below.
    AUTH_BYPASS: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
    AUTH_BYPASS_ROLE: z.enum(['technician', 'admin']).default('admin'),

    ARCGIS_API_KEY: z.string().optional(),

    PME_HOST: z.string().optional(),
    PME_INSTANCE: z.string().optional(),
    PME_USER: z.string().optional(),
    PME_PASSWORD: z.string().optional(),
    PME_WINDOWS_AUTH: z
        .enum(['true', 'false'])
        .default('true')
        .transform((v) => v === 'true'),

    SYNC_CRON: z.string().default('0 2 * * *'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
    const parsed = envSchema.parse(raw);

    if (parsed.NODE_ENV === 'production' && parsed.AUTH_BYPASS) {
        throw new Error('AUTH_BYPASS must not be true when NODE_ENV=production');
    }
    if (!parsed.AUTH_BYPASS) {
        const missing = (['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_AUDIENCE'] as const).filter(
            (k) => !parsed[k],
        );
        if (missing.length > 0) {
            throw new Error(
                `Azure AD config required when AUTH_BYPASS=false. Missing: ${missing.join(', ')}`,
            );
        }
    }
    return parsed;
}
