-- Migration 003: add ArcGIS display key + app-owned IP + ArcGIS serial number to meters.
--
-- Column ownership (enforced in service code, not the DB):
--   arcgis_meter_id   — written by ArcGIS sync (Meter_ID field). Short display key shown
--                       to workers (e.g. '1E1', '2ME1'). Never used as a join key — the
--                       PK ion_device_name remains the universal join key.
--   meter_ip_address  — app-owned (admin-editable). Never overwritten by any sync.
--   serial_number     — written by ArcGIS sync (Serial_Number field). Read-only reference.
--
-- The partial index on arcgis_meter_id supports the future Excel-meter join during the
-- initial pin-config seed, and any "look up by display ID" admin query.
--
-- Rollback: backend/migrations/down/003_add_meters_arcgis_and_ip_columns.sql
-- Project convention is forward-only — do NOT add a "-- Down Migration" block here.

ALTER TABLE meters
    ADD COLUMN arcgis_meter_id  VARCHAR(50),
    ADD COLUMN meter_ip_address VARCHAR(45),
    ADD COLUMN serial_number    VARCHAR(100);

CREATE INDEX idx_meters_arcgis_meter_id ON meters (arcgis_meter_id)
    WHERE arcgis_meter_id IS NOT NULL;
