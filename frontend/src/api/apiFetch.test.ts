import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';

describe('apiFetch', () => {
  it('returns parsed JSON on a 2xx', async () => {
    const { apiFetch } = await import('./apiFetch');
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })));
    await expect(apiFetch('/api/ping')).resolves.toEqual({ ok: true });
  });

  it('throws ApiError with the status and NestJS string message on non-2xx', async () => {
    const { apiFetch, ApiError } = await import('./apiFetch');
    server.use(http.get('/api/bad', () => HttpResponse.json({ message: 'nope' }, { status: 400 })));
    const err = await apiFetch('/api/bad').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe('nope');
  });

  it('joins a NestJS array message into one string', async () => {
    const { apiFetch } = await import('./apiFetch');
    server.use(
      http.get('/api/bad2', () => HttpResponse.json({ message: ['a', 'b'] }, { status: 422 })),
    );
    const err = await apiFetch('/api/bad2').catch((e) => e);
    expect(err.message).toBe('a, b');
  });

  it('injects the X-Test-User header when auth bypass is enabled', async () => {
    vi.stubEnv('VITE_AUTH_BYPASS', 'true');
    vi.resetModules();
    const { apiFetch } = await import('./apiFetch');
    let seen: string | null = null;
    server.use(
      http.post('/api/echo', ({ request }) => {
        seen = request.headers.get('X-Test-User');
        return HttpResponse.json({});
      }),
    );
    await apiFetch('/api/echo', { method: 'POST', body: JSON.stringify({}) });
    expect(seen).toBe('admin@mcmaster.ca');
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
