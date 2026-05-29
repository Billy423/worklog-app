import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Toaster } from 'sonner';
import { App } from './App';
import './index.css';

// gcTime must be >= the persister maxAge, or a query is evicted before it persists.
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: ONE_DAY_MS,
    },
  },
});

// ADR-004 Option A: persist the query cache so meters/pins survive an offline reload.
// createAsyncStoragePersister takes a sync Storage; the sync variant is deprecated.
const persister = createAsyncStoragePersister({ storage: window.localStorage });

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: ONE_DAY_MS, buster: 'v1' }}
    >
      <App />
      <Toaster richColors position="top-center" />
    </PersistQueryClientProvider>
  </StrictMode>,
);
