// localStorage-backed queue for unsynced work log entries (ADR-004 Option C).
// The UI side ("Save for Later" button, Pending badge, sync action) lands later;
// these are the primitives.
//
// Schema: an array of { id, payload, savedAt, lastError? } at
// localStorage["worklog:pendingEntries"]. id is a client-generated UUID so it
// remains stable across retries.

export interface PendingEntry<TPayload = unknown> {
    id: string;
    payload: TPayload;
    savedAt: string; // ISO timestamp
    lastError?: string;
}

const STORAGE_KEY = 'worklog:pendingEntries';

function read(): PendingEntry[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as PendingEntry[]) : [];
    } catch {
        // Corrupt JSON — drop it rather than poisoning every subsequent read.
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
}

function write(entries: PendingEntry[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function uuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listPending(): PendingEntry[] {
    return read();
}

export function countPending(): number {
    return read().length;
}

export function enqueuePending<TPayload>(payload: TPayload): PendingEntry<TPayload> {
    const entry: PendingEntry<TPayload> = {
        id: uuid(),
        payload,
        savedAt: new Date().toISOString(),
    };
    write([...read(), entry as PendingEntry]);
    return entry;
}

export function removePending(id: string): void {
    write(read().filter((e) => e.id !== id));
}

export function markPendingError(id: string, message: string): void {
    write(read().map((e) => (e.id === id ? { ...e, lastError: message } : e)));
}

export function clearPending(): void {
    write([]);
}
