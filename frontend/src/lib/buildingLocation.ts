// Building/Room are not separate API resources for the prototype — they're
// derived client-side from each meter's `buildingLocation` string (an ArcGIS
// field, e.g. "Bldg 1 - B136A"). These pure helpers parse and group meters so
// the cascading Building → Room → Meter pickers can be built without an extra
// endpoint. See frontend spec "Form Flow".
//
// PROTOTYPE STOPGAP — string parsing, not a real data model.
// We infer structure (building, room) from a single human-readable display
// string. This assumes the ArcGIS convention "<building> - <room>" holds for
// every meter; rows that don't follow it degrade gracefully (whole string
// becomes the building, room is empty) but won't group sensibly.
//
// Future enhancement (deferred post-prototype, see issue "Building/room
// resource"): the backend should expose building and room as structured,
// normalized fields (or a dedicated resource) so the picker keys off real IDs
// instead of re-parsing a display string on every client. When that lands,
// these helpers should be replaced by reads of those fields — keep the parsing
// confined to this module so the swap is localized.

import type { Meter } from '@/api/schemas';

export interface ParsedLocation {
  building: string;
  room: string;
}

/** Split a `buildingLocation` on the first " - ". If there's no separator, the
 *  whole string is the building and the room is empty. */
export function parseBuildingLocation(raw: string): ParsedLocation {
  const sep = raw.indexOf(' - ');
  if (sep === -1) {
    return { building: raw.trim(), room: '' };
  }
  return {
    building: raw.slice(0, sep).trim(),
    room: raw.slice(sep + 3).trim(),
  };
}

/** Unique building names across all meters, alphabetically sorted. */
export function listBuildings(meters: Meter[]): string[] {
  const set = new Set<string>();
  for (const m of meters) {
    set.add(parseBuildingLocation(m.buildingLocation).building);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Unique room labels within one building, alphabetically sorted. */
export function listRooms(meters: Meter[], building: string): string[] {
  const set = new Set<string>();
  for (const m of meters) {
    const loc = parseBuildingLocation(m.buildingLocation);
    if (loc.building === building) set.add(loc.room);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Meters in a given building + room, sorted by display name. */
export function listMetersAt(meters: Meter[], building: string, room: string): Meter[] {
  return meters
    .filter((m) => {
      const loc = parseBuildingLocation(m.buildingLocation);
      return loc.building === building && loc.room === room;
    })
    .sort((a, b) => a.pmeDisplayName.localeCompare(b.pmeDisplayName));
}
