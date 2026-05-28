// RBAC integration test for work-logs.
//
// Scope: verifies the "technician sees own entries only; admin sees all" rule. CI green
// without this test would not catch a scoping regression — the logic lives in the service
// layer and a simple unit test of the repository wouldn't exercise it end-to-end.
//
// Auth strategy: override JwtAuthGuard with a TestAuthGuard that reads identity from
// `x-test-oid` and `x-test-roles` headers. This sidesteps AUTH_BYPASS (which forces a
// single identity for every request) and gives each test full control over the caller.

import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser, Role } from '../src/auth/types/user';
import { PG_POOL } from '../src/database/database.module';

class TestAuthGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<{
            headers: Record<string, string | undefined>;
            user?: AuthenticatedUser;
        }>();
        const oid = req.headers['x-test-oid'];
        const rolesHeader = req.headers['x-test-roles'] ?? '';
        if (!oid) return false;
        const roles = rolesHeader
            .split(',')
            .map((r) => r.trim())
            .filter((r): r is Role => r === 'technician' || r === 'admin');
        req.user = {
            oid,
            email: `${oid}@test.local`,
            name: oid,
            roles,
        };
        return true;
    }
}

const TEST_METER = 'TEST.01E1';
const TECH_A = 'tech-a-oid';
const TECH_B = 'tech-b-oid';
const ADMIN = 'admin-oid';

describe('Work logs RBAC scoping (e2e)', () => {
    let app: INestApplication;
    let pool: Pool;

    beforeAll(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(JwtAuthGuard)
            .useClass(TestAuthGuard)
            .compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();

        pool = app.get<Pool>(PG_POOL);

        // Fixture: a single meter + three work-log entries owned by two different
        // technicians. The admin row is included to confirm admins see entries they
        // didn't author.
        await pool.query(
            `INSERT INTO meters (ion_device_name, pme_display_name, enabled)
             VALUES ($1, 'TEST-METER', true)
             ON CONFLICT (ion_device_name) DO NOTHING`,
            [TEST_METER],
        );
        await pool.query(`DELETE FROM work_log_entries WHERE meter_ion_device_name = $1`, [
            TEST_METER,
        ]);
        await pool.query(
            `INSERT INTO work_log_entries
                (meter_ion_device_name, user_oid, user_email, pin_ids, notes)
             VALUES
                ($1, $2, $3, '{}', 'tech A entry 1'),
                ($1, $2, $3, '{}', 'tech A entry 2'),
                ($1, $4, $5, '{}', 'tech B entry')`,
            [TEST_METER, TECH_A, `${TECH_A}@test.local`, TECH_B, `${TECH_B}@test.local`],
        );
    });

    afterAll(async () => {
        await pool.query(`DELETE FROM work_log_entries WHERE meter_ion_device_name = $1`, [
            TEST_METER,
        ]);
        await pool.query(`DELETE FROM meters WHERE ion_device_name = $1`, [TEST_METER]);
        await app.close();
    });

    it('technician sees only their own entries', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/work-logs')
            .query({ meterId: TEST_METER })
            .set('x-test-oid', TECH_A)
            .set('x-test-roles', 'technician')
            .expect(200);

        expect(res.body.total).toBe(2);
        expect(res.body.data).toHaveLength(2);
        for (const row of res.body.data) {
            expect(row.userEmail).toBe(`${TECH_A}@test.local`);
        }
    });

    it('admin sees all entries regardless of author', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/work-logs')
            .query({ meterId: TEST_METER })
            .set('x-test-oid', ADMIN)
            .set('x-test-roles', 'admin')
            .expect(200);

        expect(res.body.total).toBe(3);
        const emails = (res.body.data as Array<{ userEmail: string }>).map((r) => r.userEmail);
        expect(emails).toEqual(
            expect.arrayContaining([`${TECH_A}@test.local`, `${TECH_B}@test.local`]),
        );
    });

    it('technician with no matching entries gets empty page', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/work-logs')
            .query({ meterId: TEST_METER })
            .set('x-test-oid', 'unknown-oid')
            .set('x-test-roles', 'technician')
            .expect(200);

        expect(res.body.total).toBe(0);
        expect(res.body.data).toEqual([]);
    });
});
