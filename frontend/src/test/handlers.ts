// Default MSW handlers covering the happy path. Individual tests override these
// with server.use(...) to assert error/empty/offline behaviour.

import { http, HttpResponse } from 'msw';

export const meters = [
  {
    ionDeviceName: '01.01E1',
    pmeDisplayName: '01 Electricity 1',
    buildingLocation: 'Bldg 1 - B136A',
    hardwareModel: 'ION7700',
    lat: null,
    lon: null,
  },
  {
    ionDeviceName: '01.01M1',
    pmeDisplayName: '01 Main Steam',
    buildingLocation: 'Bldg 1 - B201',
    hardwareModel: 'PM5560',
    lat: null,
    lon: null,
  },
];

export const pins = [
  { id: 1, pinId: 'D1', utility: 'electricity', pinLabel: '1 Electricity Main', unit: 'kWh', displayOrder: 1 },
  { id: 2, pinId: 'D2', utility: 'steam', pinLabel: '1 Steam Supply', unit: '1,000 lbs', displayOrder: 2 },
];

export const handlers = [
  http.get('/api/meters', () => HttpResponse.json(meters)),

  // Pins for 01.01E1; every other meter is electricity-only (empty pins, AC2).
  http.get('/api/meters/:ion/pins', ({ params }) =>
    HttpResponse.json(params.ion === '01.01E1' ? pins : []),
  ),

  http.post('/api/work-logs', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'wl-1',
        meterIonDeviceName: body.meterIonDeviceName,
        submittedByEmail: 'dev@worklog.local',
        pinIds: body.pinIds ?? [],
        notes: body.notes ?? null,
        loggedAt: body.loggedAt ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
