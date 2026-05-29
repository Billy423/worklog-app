// Shared fetch wrapper for all backend calls. Handles base URL, JSON
// encoding, the prototype auth-bypass header, and error normalization.
//
// Auth (prototype): when VITE_AUTH_BYPASS === 'true' we inject an
// `X-Test-User` header instead of an Azure AD bearer token. The backend's
// AUTH_BYPASS guard derives the role from this email. No MSAL for June 8.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';
const TEST_USER = 'admin@mcmaster.ca';

/** Thrown for any non-2xx response. Carries the HTTP status + parsed body. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Pull a human-readable message out of a NestJS error body, if present. */
function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  return `Request failed (${status})`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (AUTH_BYPASS) {
    headers.set('X-Test-User', TEST_USER);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      // Non-JSON error response — leave body undefined.
    }
    throw new ApiError(res.status, extractMessage(body, res.status), body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
