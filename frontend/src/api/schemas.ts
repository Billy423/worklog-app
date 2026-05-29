// zod schemas + inferred types for the WorkLog API responses.
// Source of truth: specs/api/api-contract.md. Unknown keys are stripped by
// default, so the backend can add fields without breaking parsing here.

import { z } from 'zod';

/** `GET /api/meters` — list item. Only the fields the UI relies on are
 *  validated strictly; coordinates are tolerated as nullable for robustness. */
export const meterSchema = z.object({
  ionDeviceName: z.string(),
  pmeDisplayName: z.string(),
  buildingLocation: z.string(),
  hardwareModel: z.string().nullish(),
  lat: z.number().nullish(),
  lon: z.number().nullish(),
});
export type Meter = z.infer<typeof meterSchema>;

/** `GET /api/meters/:ionDeviceName/pins` — one I/O pin row. */
export const meterPinSchema = z.object({
  id: z.number(),
  pinId: z.string(),
  utility: z.string(),
  pinLabel: z.string(),
  unit: z.string().nullish(),
  displayOrder: z.number(),
});
export type MeterPin = z.infer<typeof meterPinSchema>;

/** `POST /api/work-logs` — success (201) response. */
export const workLogSchema = z.object({
  id: z.string(),
  meterIonDeviceName: z.string(),
  submittedByEmail: z.string(),
  pinIds: z.array(z.string()),
  notes: z.string().nullish(),
  loggedAt: z.string(),
  createdAt: z.string(),
});
export type WorkLog = z.infer<typeof workLogSchema>;

/** `POST /api/work-logs` — request body. Also the shape stored in the offline
 *  queue so a replayed entry is a verbatim re-POST. `loggedAt` is the client's
 *  submit time (preserved for queued entries replayed later). */
export interface CreateWorkLogInput {
  meterIonDeviceName: string;
  pinIds: string[];
  notes?: string;
  loggedAt: string;
}
