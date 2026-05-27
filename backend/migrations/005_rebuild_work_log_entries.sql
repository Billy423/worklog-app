-- Migration 005: rebuild work_log_entries to the agreed shape.
--
-- The migration 002 stub is empty in every environment (no rows have been written), so
-- DROP + CREATE is safe and cleaner than a chain of ALTER RENAME / ALTER TYPE.
--
-- Key shape:
--   id (UUID)            — client-generatable for the offline submit queue, so submissions
--                          made offline have stable identifiers before the server sees them.
--   meter_ion_device_name FK to meters (universal join key from PME).
--   user_oid + user_email — submitter identity from the Azure AD JWT. Email is
--                          denormalised at insert time so we don't need a users table
--                          to render lists. Stale if a user's email ever changes —
--                          acceptable for an audit log.
--   pin_ids VARCHAR(20)[] — snapshot of pins the worker reported. Intentionally NOT a
--                          FK to meter_io_pins: pins are editable, work logs are
--                          immutable history. Validated at the controller layer only
--                          (rejects unknown pin_ids at write time but never blocks or
--                          mutates existing rows when pins are later renamed/deleted).
--   logged_at             — when the work was performed (user-settable, may be in the past).
--   created_at            — when the row was inserted (system time, immutable).
--   no updated_at         — entries are immutable in MVP; edits would be a separate feature.
--
-- Rollback: backend/migrations/down/005_rebuild_work_log_entries.sql
-- (restores the migration 002 stub shape exactly so the chain is reversible)

DROP TABLE IF EXISTS work_log_entries;

CREATE TABLE work_log_entries (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    meter_ion_device_name   VARCHAR(200)    NOT NULL
                            REFERENCES meters(ion_device_name),

    user_oid                VARCHAR(128)    NOT NULL,
    user_email              VARCHAR(200)    NOT NULL,

    pin_ids                 VARCHAR(20)[]   NOT NULL DEFAULT '{}',

    notes                   TEXT,

    logged_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_log_entries_meter      ON work_log_entries (meter_ion_device_name);
CREATE INDEX idx_work_log_entries_user_oid   ON work_log_entries (user_oid);
CREATE INDEX idx_work_log_entries_logged_at  ON work_log_entries (logged_at DESC);
