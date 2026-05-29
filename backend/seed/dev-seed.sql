-- dev-seed.sql — local development test data only.
-- Populates meters and meter_io_pins with enough rows to exercise
-- the full frontend form flow:
--   - 3 buildings, 2 rooms each → tests cascading picker
--   - some meters with pins, some without → tests empty-pin state (AC2)
--
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- Run via: docker compose exec app npm run seed:dev
-- Requires migrations 001-004 to be applied first.
--
-- DO NOT run against production. This data is fictional.

-- ─── Meters ──────────────────────────────────────────────────────────────────
-- Format mirrors real ArcGIS data:
--   ion_device_name  →  '01.01E1' style (PME Device.Name)
--   arcgis_meter_id  →  short display code e.g. '1E1'  (ArcGIS Meter_ID)
--   building_location → 'Bldg N - RoomCode'             (ArcGIS Building_Location)

INSERT INTO meters (
    ion_device_name, pme_display_name, arcgis_meter_id,
    building_location, hardware_model, enabled
) VALUES
    -- Bldg 1 — two rooms
    ('01.01E1',  '01 Electricity 1',  '1E1',   'Bldg 1 - B136A',  'ION7700',  true),
    ('01.01E2',  '01 Electricity 2',  '1E2',   'Bldg 1 - B136A',  'ION7700',  true),
    ('01.01M1',  '01 Main Steam',     '1M1',   'Bldg 1 - B201',   'PM5560',   true),
    ('01.01M2',  '01 Main Gas',       '1M2',   'Bldg 1 - B201',   'PM5560',   true),

    -- Bldg 4 — two rooms
    ('04.04ME1', '04 Main Electric',  '4ME1',  'Bldg 4 - B111',   'ION9000',  true),
    ('04.04E1',  '04 Electricity 1',  '4E1',   'Bldg 4 - B111',   'ION7700',  true),
    ('04.04W1',  '04 Water',          '4W1',   'Bldg 4 - G002',   'PM5100',   true),

    -- Bldg 11 — two rooms
    ('11.11M1',  '11 Steam Main',     '11M1',  'Bldg 11 - B208',  'ION7700',  true),
    ('11.11E1',  '11 Electricity 1',  '11E1',  'Bldg 11 - B208',  'ION7700',  true),
    ('11.11C1',  '11 Chilled Water',  '11C1',  'Bldg 11 - G101',  'PM5560',   true)
ON CONFLICT (ion_device_name) DO NOTHING;

-- ─── I/O Pins ─────────────────────────────────────────────────────────────────
-- Pins for 6 of the 10 meters above.
-- 01.01M1, 01.01M2, 04.04W1, 11.11C1 intentionally have NO pins → tests AC2.

INSERT INTO meter_io_pins (
    ion_device_name, pin_id, utility, pin_label, unit, display_order
) VALUES
    -- 01.01E1 — electricity + steam
    ('01.01E1', 'D1',  'electricity',  '1 Electricity Main',   'kWh',              1),
    ('01.01E1', 'D2',  'steam',        '1 Steam Supply',        '1,000 lbs@150 psi', 2),

    -- 01.01E2 — electricity only
    ('01.01E2', 'D1',  'electricity',  '2 Electricity Annex',  'kWh',              1),

    -- 04.04ME1 — electricity + natural gas
    ('04.04ME1', 'AS1', 'electricity', '4 Main Feed',          'kWh',              1),
    ('04.04ME1', 'AS2', 'natural_gas', '4 Gas Supply',         'm³',               2),
    ('04.04ME1', 'AS3', 'steam',       '4 Steam Annex',        '1,000 lbs@150 psi', 3),

    -- 04.04E1 — chilled water
    ('04.04E1', 'D1',  'chilled_water', '4 Chilled Water',    'tonhr',            1),

    -- 11.11M1 — steam + condensate
    ('11.11M1', 'D1',  'steam',        '11 Steam Main',        '1,000 lbs@150 psi', 1),
    ('11.11M1', 'D2',  'condensate',   '11 Condensate Return', '1,000 lbs@150 psi', 2),

    -- 11.11E1 — electricity
    ('11.11E1', 'D1',  'electricity',  '11 Electricity Main',  'kWh',              1),
    ('11.11E1', 'D2',  'electricity',  '11 Electricity Sub',   'kWh',              2)
ON CONFLICT (ion_device_name, pin_id) DO NOTHING;
