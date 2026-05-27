-- Migration 004: meter_io_pins — app-owned I/O channel configuration per meter.
--
-- Ownership: app. Never written by PME or ArcGIS sync. Editable by any authenticated
-- role (policy enforced in the controller via RolesGuard).
--
-- Each row is one physical channel on one meter, describing what utility it measures,
-- the human-readable label, and the measurement unit. Populates the worker form's
-- "I/O pins worked on" dropdown.
--
-- Utility is constrained to a fixed vocabulary via CHECK. The 13 codes here are the
-- normalised set derived from the energy manager's source data. CHECK chosen over a
-- lookup table for prototype simplicity; if admins later need to add utility types via
-- the UI, promote to a reference table (one migration to drop the CHECK and add an FK).
--
-- ON DELETE CASCADE is safe because meters get disabled (enabled=false), not hard-deleted.
-- If a meter is ever truly deleted, its pins are useless without it.
--
-- Rollback: backend/migrations/down/004_create_meter_io_pins.sql

CREATE TABLE meter_io_pins (
    id              SERIAL          PRIMARY KEY,

    ion_device_name VARCHAR(200)    NOT NULL
                    REFERENCES meters(ion_device_name) ON DELETE CASCADE,

    pin_id          VARCHAR(20)     NOT NULL,
        -- Verbatim hardware channel ID: 'D1', 'AS2', 'I/O3'. Not normalised.

    utility         VARCHAR(50)     NOT NULL
                    CHECK (utility IN (
                        'electricity',
                        'steam',
                        'chilled_water',
                        'city_water',
                        'city_water_lab',
                        'natural_gas',
                        'gas',
                        'nitrogen',
                        'heating',
                        'condensate',
                        'turbine_gas',
                        'duct_burner_gas',
                        'boiler_gas'
                    )),

    pin_label       VARCHAR(200),
        -- Human-readable channel name, e.g. '1 Steam', '9 South Annex'.

    unit            VARCHAR(50),
        -- Free-text measurement unit, e.g. '1,000 lbs@150 psi', '1 tonhr'.

    display_order   SMALLINT        NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (ion_device_name, pin_id)
);

CREATE INDEX idx_meter_io_pins_device ON meter_io_pins (ion_device_name);
