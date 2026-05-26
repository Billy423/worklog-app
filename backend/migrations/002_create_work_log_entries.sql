-- Migration: create work_log_entries stub table
-- Core WorkLog write table. Columns are minimal until requirements are finalised
-- (work-type taxonomy, I/O pins worked, photo URLs, notes field, etc.).
-- submitted_by_oid references the Azure AD user OID from the JWT — no separate
-- users table is required in MVP since identity comes from the token.

-- Up
CREATE TABLE work_log_entries (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_ion_device_name   VARCHAR(200)    NOT NULL REFERENCES meters(ion_device_name),
    submitted_by_oid        VARCHAR(128)    NOT NULL,
        -- Azure AD OID from the access token; immutable identifier for the submitting user.

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    notes                   TEXT
        -- free-text description of work performed (MVP day-one)

    -- TODO: add columns after requirements finalised
    --   work_type        VARCHAR(100)  — category (e.g. 'pin_relabel', 'inspection', 'repair')
    --   notes            TEXT          — free-text description (MVP1 primary field)
    --   io_pins_worked   TEXT[]        — array of pin names worked on
    --   photo_urls       TEXT[]        — uploaded photo references
);

CREATE INDEX idx_work_log_entries_meter ON work_log_entries (meter_ion_device_name);
CREATE INDEX idx_work_log_entries_submitted_by ON work_log_entries (submitted_by_oid);
CREATE INDEX idx_work_log_entries_created_at ON work_log_entries (created_at DESC);

-- Down
DROP INDEX IF EXISTS idx_work_log_entries_created_at;
DROP INDEX IF EXISTS idx_work_log_entries_submitted_by;
DROP INDEX IF EXISTS idx_work_log_entries_meter;
DROP TABLE IF EXISTS work_log_entries;
