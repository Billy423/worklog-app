import { describe, it, expect } from 'vitest';
import type { Meter } from '@/api/schemas';
import {
  parseBuildingLocation,
  listBuildings,
  listRooms,
  listMetersAt,
} from './buildingLocation';

function meter(buildingLocation: string, pmeDisplayName = 'x', ionDeviceName = pmeDisplayName): Meter {
  return { ionDeviceName, pmeDisplayName, buildingLocation, hardwareModel: null, lat: null, lon: null };
}

describe('parseBuildingLocation', () => {
  it('splits building and room on the first " - "', () => {
    expect(parseBuildingLocation('Bldg 1 - B136A')).toEqual({ building: 'Bldg 1', room: 'B136A' });
  });

  it('folds extra separators into the room (splits on the FIRST only)', () => {
    expect(parseBuildingLocation('Bldg 4 - Mech - North')).toEqual({
      building: 'Bldg 4',
      room: 'Mech - North',
    });
  });

  it('treats a string with no separator as building-only', () => {
    expect(parseBuildingLocation('Central Plant')).toEqual({ building: 'Central Plant', room: '' });
  });

  it('trims surrounding whitespace', () => {
    expect(parseBuildingLocation('  Bldg 1  -  B201 ')).toEqual({ building: 'Bldg 1', room: 'B201' });
  });
});

describe('listBuildings', () => {
  it('returns unique building names, alphabetically sorted', () => {
    const meters = [meter('Bldg 4 - B111'), meter('Bldg 1 - B136A'), meter('Bldg 1 - B201')];
    expect(listBuildings(meters)).toEqual(['Bldg 1', 'Bldg 4']);
  });
});

describe('listRooms', () => {
  it('returns unique rooms within a building, sorted', () => {
    const meters = [meter('Bldg 1 - B201'), meter('Bldg 1 - B136A'), meter('Bldg 4 - B111')];
    expect(listRooms(meters, 'Bldg 1')).toEqual(['B136A', 'B201']);
  });
});

describe('listMetersAt', () => {
  it('filters by building + room and sorts by display name', () => {
    const meters = [
      meter('Bldg 1 - B136A', '01 Electricity 2', '01.01E2'),
      meter('Bldg 1 - B136A', '01 Electricity 1', '01.01E1'),
      meter('Bldg 1 - B201', '01 Main Steam', '01.01M1'),
    ];
    expect(listMetersAt(meters, 'Bldg 1', 'B136A').map((m) => m.ionDeviceName)).toEqual([
      '01.01E1',
      '01.01E2',
    ]);
  });
});
