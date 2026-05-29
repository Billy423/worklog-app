// Top-level layout. Header + dev-mode/offline/pending-sync banners + content.

import { DevModeBanner } from './layout/DevModeBanner';
import { Header } from './layout/Header';
import { OfflineBanner } from './layout/OfflineBanner';
import { PendingSyncBanner } from './layout/PendingSyncBanner';
import { WorkLogForm } from './features/worklog/WorkLogForm';

export function App() {
  return (
    <>
      <Header />
      <DevModeBanner />
      <OfflineBanner />
      <PendingSyncBanner />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <WorkLogForm />
      </main>
    </>
  );
}
