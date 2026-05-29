// Reactive view of the localStorage pending-sync queue. Re-renders when an
// entry is enqueued (form, offline submit) or removed (after a successful sync)
// in this tab via subscribePending, and across tabs via the `storage` event.

import { useEffect, useState } from 'react';
import { listPending, subscribePending, type PendingEntry } from './pendingQueue';

export function usePendingEntries(): PendingEntry[] {
    const [entries, setEntries] = useState<PendingEntry[]>(() => listPending());

    useEffect(() => {
        const update = () => setEntries(listPending());
        const unsubscribe = subscribePending(update);
        window.addEventListener('storage', update);
        return () => {
            unsubscribe();
            window.removeEventListener('storage', update);
        };
    }, []);

    return entries;
}
