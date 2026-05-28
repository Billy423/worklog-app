// Placeholder env for the OpenAPI export. MUST be imported before AppModule: its
// ConfigModule.forRoot validates process.env eagerly at import time, so DATABASE_URL et al.
// have to exist first (CI has no .env). The app is only introspected for route metadata —
// never started or connected — so these placeholders are safe.

process.env.NODE_ENV ??= 'development';
process.env.AUTH_BYPASS ??= 'true';
process.env.DATABASE_URL ??= 'postgresql://openapi:openapi@localhost:5432/openapi';
