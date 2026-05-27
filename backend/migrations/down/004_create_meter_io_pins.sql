-- Rollback for migration 004.
-- Apply manually: psql "$DATABASE_URL" -f migrations/down/004_create_meter_io_pins.sql

DROP INDEX IF EXISTS idx_meter_io_pins_device;
DROP TABLE IF EXISTS meter_io_pins;
