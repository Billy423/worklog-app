// TanStack Query hooks for the WorkLog API. Each query function fetches via
// `apiFetch` and validates the response with its zod schema, so components
// always receive parsed, typed data (or a thrown error).

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from './apiFetch';
import {
  meterPinSchema,
  meterSchema,
  workLogSchema,
  type CreateWorkLogInput,
  type Meter,
  type MeterPin,
  type WorkLog,
} from './schemas';

/** All enabled meters — drives the Building/Room/Meter pickers. */
export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: async (): Promise<Meter[]> => {
      const data = await apiFetch<unknown>('/api/meters');
      return meterSchema.array().parse(data);
    },
  });
}

/** I/O pins for one meter. Disabled until a meter is selected. */
export function useMeterPins(ionDeviceName: string | undefined) {
  return useQuery({
    queryKey: ['meter-pins', ionDeviceName],
    queryFn: async (): Promise<MeterPin[]> => {
      const data = await apiFetch<unknown>(
        `/api/meters/${encodeURIComponent(ionDeviceName!)}/pins`,
      );
      return meterPinSchema.array().parse(data);
    },
    enabled: Boolean(ionDeviceName),
  });
}

/** POST one work-log entry and return the parsed 201 response. */
export async function postWorkLog(input: CreateWorkLogInput): Promise<WorkLog> {
  const data = await apiFetch<unknown>('/api/work-logs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return workLogSchema.parse(data);
}

/**
 * Delivery-only POST for the offline-queue drain. Success is any 2xx — the
 * server has committed the write — independent of whether the response body
 * matches `workLogSchema`. The drain uses this instead of `postWorkLog` so a
 * harmless response-shape drift can't make an already-saved entry look failed
 * and get re-sent as a duplicate.
 */
export async function deliverWorkLog(input: CreateWorkLogInput): Promise<void> {
  await apiFetch<unknown>('/api/work-logs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Submit a work log entry. Returns the parsed 201 response. */
export function useSubmitWorkLog() {
  return useMutation({ mutationFn: postWorkLog });
}
