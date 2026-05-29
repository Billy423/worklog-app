// Shows whenever the offline queue is non-empty (ADR-004 Option C). "Sync now"
// drains the queue by POSTing each entry through the same path as a live
// submit; successful entries are removed, failures stay queued with their
// error recorded for a later retry. Sync is manual — nothing auto-fires on
// reconnect, by design.

import { useState } from 'react';
import { toast } from 'sonner';

import { postWorkLog } from '@/api/queries';
import { ApiError } from '@/api/apiFetch';
import type { CreateWorkLogInput } from '@/api/schemas';
import { listPending, markPendingError, removePending } from '@/offline/pendingQueue';
import { usePendingEntries } from '@/offline/usePendingEntries';
import { useOnlineStatus } from '@/offline/useOnlineStatus';
import { Button } from '@/components/ui/button';

export function PendingSyncBanner() {
  const entries = usePendingEntries();
  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  if (entries.length === 0) return null;

  const count = entries.length;
  const label = `${count} ${count === 1 ? 'entry' : 'entries'} pending sync`;

  const handleSync = async () => {
    setSyncing(true);
    let synced = 0;
    let failed = 0;

    // Re-read from storage so we drain the current queue, not a stale snapshot.
    for (const entry of listPending()) {
      try {
        await postWorkLog(entry.payload as CreateWorkLogInput);
        removePending(entry.id);
        synced += 1;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Sync failed — will retry';
        markPendingError(entry.id, message);
        failed += 1;
      }
    }

    setSyncing(false);

    if (failed === 0) {
      toast.success(`Synced ${synced} ${synced === 1 ? 'entry' : 'entries'}`);
    } else {
      toast.error(`Synced ${synced}, ${failed} still pending — try again later`);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 bg-mcmaster-gold px-4 py-2 text-sm font-medium text-mcmaster-maroon-dark"
    >
      <span>{label}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!online || syncing}
        onClick={handleSync}
        className="h-7 border-mcmaster-maroon/30 bg-white/70 text-mcmaster-maroon-dark hover:bg-white"
      >
        {syncing ? 'Syncing…' : online ? 'Sync now' : 'Offline'}
      </Button>
    </div>
  );
}
