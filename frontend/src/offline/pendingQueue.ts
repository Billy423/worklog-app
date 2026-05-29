// localStorage-backed queue for unsynced work log entries (ADR-004 Option C).
//
// Stored shape (localStorage["worklog:pendingEntries"]):
//   { version: QUEUE_VERSION, entries: PendingEntry[] }
// id is a client-generated UUID so an entry is stable across retries.
//
// The envelope is versioned so a payload-shape change can't leave stale,
// no-longer-valid entries from an older build sitting in the queue. On read,
// a legacy bare array or a mismatched version is discarded (not migrated) —
// acceptable for a prototype queue. Bump QUEUE_VERSION only on a breaking
// change to the queued payload shape.

export interface PendingEntry<TPayload = unknown> {
    id: string;
    payload: TPayload;
    savedAt: string; // ISO timestamp
    lastError?: string;
}

const STORAGE_KEY = 'worklog:pendingEntries';
const QUEUE_VERSION = 1;

interface QueueEnvelope {
    version: number;
    entries: PendingEntry[];
}

// In-tab change notification. localStorage's `storage` event only fires in
// OTHER tabs, so components in this tab need their own signal to re-render when
// the queue mutates. Listeners are notified on every write().
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribePending(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notify(): void {
    for (const listener of listeners) listener();
}

function read(): PendingEntry[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        // Accept only the current versioned envelope. A legacy bare array or any
        // other version is from an older build whose payload shape may no longer
        // validate server-side — discard it so a stale entry can't poison every sync.
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            !Array.isArray(parsed) &&
            (parsed as QueueEnvelope).version === QUEUE_VERSION &&
            Array.isArray((parsed as QueueEnvelope).entries)
        ) {
            return (parsed as QueueEnvelope).entries;
        }
        localStorage.removeItem(STORAGE_KEY);
        return [];
    } catch {
        // Corrupt JSON — drop it rather than poisoning every subsequent read.
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
}

function write(entries: PendingEntry[]): void {
    if (typeof localStorage === 'undefined') return;
    const envelope: QueueEnvelope = { version: QUEUE_VERSION, entries };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    notify();
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
