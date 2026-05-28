// Top-level layout. Header + dev-mode/offline banners + content area.
// The work-log entry form (and offline sync banner) land in later steps of
// this phase; this is the visual frame with the Tailwind/shadcn toolchain wired.

import { DevModeBanner } from './layout/DevModeBanner';
import { Header } from './layout/Header';
import { OfflineBanner } from './layout/OfflineBanner';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

export function App() {
  return (
    <>
      <Header />
      <DevModeBanner />
      <OfflineBanner />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Form goes here</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            The work-log entry form lands in a follow-up step of this phase.
          </CardContent>
        </Card>
      </main>
    </>
  );
}
