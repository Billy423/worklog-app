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
            style={{
                background: 'var(--offline-amber)',
                color: '#fff',
                padding: '10px 20px',
                textAlign: 'center',
                fontSize: '0.95rem',
            }}
        >
            You're offline — changes will be saved locally and synced when you reconnect.
        </div>
    );
}
