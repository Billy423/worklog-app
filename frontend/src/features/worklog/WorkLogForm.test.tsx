import { describe, it, expect, afterEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { countPending } from '@/offline/pendingQueue';
import { WorkLogForm } from './WorkLogForm';

async function pick(user: UserEvent, combobox: string, option: string) {
  await user.click(await screen.findByRole('combobox', { name: combobox }));
  await user.click(await screen.findByRole('option', { name: option }));
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
}

afterEach(() => setOnline(true));

describe('WorkLogForm', () => {
  it('AC1: cascades building → room → meter → pins and submits', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WorkLogForm />);

    await pick(user, 'Building', 'Bldg 1');
    await pick(user, 'Room', 'B136A');
    await pick(user, 'Meter', '01 Electricity 1 (01.01E1)');

    await user.click(await screen.findByRole('checkbox', { name: /Electricity Main/ }));
    await user.click(screen.getByRole('button', { name: 'Submit work log' }));

    expect(await screen.findByText('Work log submitted')).toBeInTheDocument();
  });

  it('AC2: shows the empty-pin state for an electricity-only meter, still submittable', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WorkLogForm />);

    await pick(user, 'Building', 'Bldg 1');
    await pick(user, 'Room', 'B201');
    await pick(user, 'Meter', '01 Main Steam (01.01M1)');

    expect(await screen.findByText('No pins configured for this meter yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit work log' })).toBeEnabled();
  });

  it('AC4: changing the building resets room/meter downstream', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WorkLogForm />);

    await pick(user, 'Building', 'Bldg 1');
    await pick(user, 'Room', 'B136A');
    await pick(user, 'Meter', '01 Electricity 1 (01.01E1)');
    expect(screen.getByRole('button', { name: 'Submit work log' })).toBeEnabled();

    await pick(user, 'Building', 'Bldg 4');

    // Meter cleared → submit disabled again, and the room trigger shows its placeholder.
    expect(screen.getByRole('button', { name: 'Submit work log' })).toBeDisabled();
    expect(within(screen.getByRole('combobox', { name: 'Room' })).getByText('Select a room')).toBeInTheDocument();
  });

  it('AC3: when offline, saves to the queue instead of posting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WorkLogForm />);

    // Cascade while online so meters/pins are loaded, then drop offline.
    await pick(user, 'Building', 'Bldg 1');
    await pick(user, 'Room', 'B136A');
    await pick(user, 'Meter', '01 Electricity 1 (01.01E1)');
    setOnline(false);

    await user.click(await screen.findByRole('button', { name: 'Save on this device' }));

    expect(await screen.findByText(/Saved on this device/)).toBeInTheDocument();
    expect(countPending()).toBe(1);
  });
});
