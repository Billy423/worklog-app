import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { enqueuePending, listPending, countPending } from '@/offline/pendingQueue';
import { PendingSyncBanner } from './PendingSyncBanner';

const payload = () => ({ meterIonDeviceName: '01.01E1', pinIds: [], loggedAt: new Date().toISOString() });

describe('PendingSyncBanner', () => {
  it('renders nothing when the queue is empty', () => {
    renderWithProviders(<PendingSyncBanner />);
    expect(screen.queryByText(/pending sync/)).not.toBeInTheDocument();
  });

  it('shows the pending count', () => {
    enqueuePending(payload());
    renderWithProviders(<PendingSyncBanner />);
    expect(screen.getByText('1 entry pending sync')).toBeInTheDocument();
  });

  it('removes 2xx-delivered entries on Sync now', async () => {
    enqueuePending(payload());
    renderWithProviders(<PendingSyncBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(countPending()).toBe(0));
  });

  it('drops a 4xx entry as permanent so it cannot wedge the queue', async () => {
    server.use(
      http.post('/api/work-logs', () => HttpResponse.json({ message: 'bad' }, { status: 400 })),
    );
    enqueuePending(payload());
    renderWithProviders(<PendingSyncBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(countPending()).toBe(0));
  });

  it('keeps a 5xx entry queued for retry', async () => {
    server.use(
      http.post('/api/work-logs', () => HttpResponse.json({ message: 'oops' }, { status: 500 })),
    );
    enqueuePending(payload());
    renderWithProviders(<PendingSyncBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(listPending()[0]?.lastError).toBeTruthy());
    expect(countPending()).toBe(1);
  });
});
