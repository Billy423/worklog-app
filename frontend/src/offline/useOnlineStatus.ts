// Subscribes to the browser's online/offline events. Returns true when the
// browser believes it has network connectivity. Used by the OfflineBanner +
// (later) by the work-log form to switch the submit button to "Save for Later".

import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState<boolean>(() =>
        typeof navigator !== 'undefined' ? navigator.onLine : true,
    );

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return online;
}
