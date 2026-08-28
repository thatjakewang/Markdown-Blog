-- Add database-level constraints matching the API's Pydantic validation.
--
-- This migration intentionally aborts if legacy invalid rows exist. Inspect and
-- correct those rows explicitly before rerunning; silently deleting or changing
-- personal records would hide data-quality problems.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM charging_records
        WHERE charge_date IS NULL
           OR provider IS NULL OR char_length(provider) NOT BETWEEN 1 AND 100
           OR amount IS NULL OR amount < 0
           OR kwh IS NULL OR kwh < 0
    ) THEN
        RAISE EXCEPTION 'charging_records contains rows that violate the new constraints';
    END IF;

    IF EXISTS (
        SELECT 1 FROM car_expenses
        WHERE date IS NULL
           OR item IS NULL OR char_length(item) NOT BETWEEN 1 AND 100
           OR amount IS NULL OR amount < 0
    ) THEN
        RAISE EXCEPTION 'car_expenses contains rows that violate the new constraints';
    END IF;

    IF EXISTS (
        SELECT 1 FROM odometer_readings
        WHERE reading_km < 0
    ) THEN
        RAISE EXCEPTION 'odometer_readings contains rows that violate the new constraints';
    END IF;
END $$;

ALTER TABLE charging_records
    ALTER COLUMN charge_date SET NOT NULL,
    ALTER COLUMN provider SET NOT NULL,
    ALTER COLUMN amount SET NOT NULL,
    ALTER COLUMN kwh SET NOT NULL;

ALTER TABLE car_expenses
    ALTER COLUMN date SET NOT NULL,
    ALTER COLUMN item SET NOT NULL,
    ALTER COLUMN amount SET NOT NULL;

ALTER TABLE charging_records
    ADD CONSTRAINT charging_records_provider_length
        CHECK (char_length(provider) BETWEEN 1 AND 100),
    ADD CONSTRAINT charging_records_amount_nonnegative CHECK (amount >= 0),
    ADD CONSTRAINT charging_records_kwh_nonnegative CHECK (kwh >= 0);

ALTER TABLE car_expenses
    ADD CONSTRAINT car_expenses_item_length
        CHECK (char_length(item) BETWEEN 1 AND 100),
    ADD CONSTRAINT car_expenses_amount_nonnegative CHECK (amount >= 0);

ALTER TABLE odometer_readings
    ADD CONSTRAINT odometer_readings_reading_nonnegative CHECK (reading_km >= 0);

COMMIT;
