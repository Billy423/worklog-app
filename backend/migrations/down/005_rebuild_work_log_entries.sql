-- Rollback for migration 005. Restores the migration 002 stub shape exactly.
-- Apply manually: psql "$DATABASE_URL" -f migrations/down/005_rebuild_work_log_entries.sql

DROP INDEX IF EXISTS idx_work_log_entries_meter;
DROP INDEX IF EXISTS idx_work_log_entries_user_oid;
DROP INDEX IF EXISTS idx_work_log_entries_logged_at;
DROP TABLE IF EXISTS work_log_entries;

CREATE TABLE work_log_entries (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_ion_device_name   VARCHAR(200)    NOT NULL REFERENCES meters(ion_device_name),
    submitted_by_oid        VARCHAR(128)    NOT NULL,

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    notes                   TEXT
);

CREATE INDEX idx_work_log_entries_meter         ON work_log_entries (meter_ion_device_name);
CREATE INDEX idx_work_log_entries_submitted_by  ON work_log_entries (submitted_by_oid);
CREATE INDEX idx_work_log_entries_created_at    ON work_log_entries (created_at DESC);
