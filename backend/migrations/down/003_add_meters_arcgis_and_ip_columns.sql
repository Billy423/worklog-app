-- Rollback for migration 003. Not auto-run by node-pg-migrate (lives outside its scan path).
-- Apply manually:
--   psql "$DATABASE_URL" -f migrations/down/003_add_meters_arcgis_and_ip_columns.sql

DROP INDEX IF EXISTS idx_meters_arcgis_meter_id;

ALTER TABLE meters
    DROP COLUMN IF EXISTS arcgis_meter_id,
    DROP COLUMN IF EXISTS meter_ip_address,
    DROP COLUMN IF EXISTS serial_number;
