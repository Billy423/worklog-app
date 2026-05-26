-- Migration 01: create meters table
-- Central cache merging ION_Network + ION_Data + ArcGIS into one flat row per meter.
-- Populated by the daily sync job (Step 7). All 135 in-scope meters have ArcGIS columns
-- populated; non-ArcGIS meters are permanently out of scope.
-- Source: specs/02-integration-architecture.md

-- Up
CREATE TABLE meters (
    -- Identity (from ION_Network + ION_Data)
    ion_device_name     VARCHAR(200)    PRIMARY KEY,
        -- ION_Network.Device.Name = ION_Data.Source.Name; the universal join key.
        -- e.g. '01.01E1', '11.11M1', '05.05ME1~79343'

    pme_display_name    VARCHAR(250),
        -- ION_Data.Source.DisplayName — shown to workers in the UI.
        -- DISPLAY ONLY — never used as a join key (~10 known divergences from device name).

    ion_source_id       INTEGER,
        -- ION_Data.Source.ID — FK needed for live alarm queries if that feature is added.

    ion_location        VARCHAR(500),
        -- ION_Network.Device.Description — richest location string.
        -- e.g. 'University Hall 01-E1, Room B136A'

    hardware_model      VARCHAR(200),
        -- ION_Network.DeviceType.DisplayName e.g. '7700', 'PM5560'

    enabled             BOOLEAN         NOT NULL DEFAULT true,
        -- ION_Network.Device.Enabled — false means decommissioned; excluded from picker.

    -- ArcGIS enrichment (all 135 in-scope meters have these populated)
    arcgis_object_id    INTEGER         UNIQUE,
        -- ArcGIS OBJECTID — stable FK, linked at seed time via static mapping table.

    building_location   VARCHAR(256),
        -- ArcGIS Building_Location e.g. 'Bldg 1 - B136A'

    digital_input       VARCHAR(1000),
        -- ArcGIS Digital_Input — utility type string.
        -- e.g. 'Electricity; D1 - Steam; D2 - Chilledwater'

    lat                 DECIMAL(10, 7),
    lon                 DECIMAL(10, 7),

    -- Sync metadata
    pme_synced_at       TIMESTAMPTZ,
    arcgis_synced_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meters_arcgis_object_id ON meters (arcgis_object_id)
    WHERE arcgis_object_id IS NOT NULL;

CREATE INDEX idx_meters_pme_display_name ON meters (pme_display_name);

-- Down
DROP INDEX IF EXISTS idx_meters_pme_display_name;
DROP INDEX IF EXISTS idx_meters_arcgis_object_id;
DROP TABLE IF EXISTS meters;
