// Shows whenever the offline queue is non-empty (ADR-004 Option C). "Sync now"
// drains the queue, classifying each result so the queue can always make
// progress:
//   - 2xx              → delivered; remove (the server committed the write)
//   - 4xx              → permanent client error (bad/stale payload); drop it,
//                        otherwise one poison entry wedges the queue forever
//   - 5xx / network    → transient; keep and retry on the next sync
// Sync is manual — nothing auto-fires on reconnect, by design.

import { useState } from 'react';
import { toast } from 'sonner';

import { deliverWorkLog } from '@/api/queries';
import { ApiError } from '@/api/apiFetch';
import type { CreateWorkLogInput } from '@/api/schemas';
import { listPending, markPendingError, removePending } from '@/offline/pendingQueue';
import { usePendingEntries } from '@/offline/usePendingEntries';
import { useOnlineStatus } from '@/offline/useOnlineStatus';
import { Button } from '@/components/ui/button';

/** Summarize a drain pass as a single toast. */
function reportSyncResult(synced: number, rejected: number, failed: number): void {
  if (rejected === 0 && failed === 0) {
    toast.success(`Synced ${synced} ${synced === 1 ? 'entry' : 'entries'}`);
    return;
  }
  const parts: string[] = [];
  if (synced > 0) parts.push(`${synced} synced`);
  if (rejected > 0) parts.push(`${rejected} rejected`);
  if (failed > 0) parts.push(`${failed} still pending`);
  const summary = parts.join(', ');
  // Rejected entries were dropped as unrecoverable — surface as an error so the
  // worker knows that data is gone; transient-only failures are just a warning.
  if (rejected > 0) {
    toast.error(summary);
  } else {
    toast.warning(`${summary} — try again later`);
  }
}

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
    let rejected = 0;
    let failed = 0;

    // Re-read from storage so we drain the current queue, not a stale snapshot.
    for (const entry of listPending()) {
      try {
        await deliverWorkLog(entry.payload as CreateWorkLogInput);
        removePending(entry.id); // 2xx — server committed the write
        synced += 1;
      } catch (err) {
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          // Permanent client error (bad/stale payload). Retrying can never
          // succeed and would wedge the queue — drop it.
          removePending(entry.id);
          rejected += 1;
        } else {
          // 5xx or network/transient — keep it queued for the next attempt.
          const message = err instanceof ApiError ? err.message : 'Sync failed — will retry';
          markPendingError(entry.id, message);
          failed += 1;
        }
      }
    }

    setSyncing(false);
    reportSyncResult(synced, rejected, failed);
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
