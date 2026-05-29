// Persistent banner shown when the browser reports no connectivity.
// ADR-004 Option C — workers see this and switch to "Save for Later".

import { useOnlineStatus } from '../offline/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[var(--offline-amber)] px-5 py-2.5 text-center text-sm text-white"
    >
      You're offline — changes will be saved locally and synced when you reconnect.
    </div>
  );
}
