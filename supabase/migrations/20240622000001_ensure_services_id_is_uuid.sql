-- Ensure services_id is UUID by recreating it
ALTER TABLE bookings DROP COLUMN IF EXISTS services_id;
ALTER TABLE bookings ADD COLUMN services_id UUID;

-- Add an index on the services_id column for better performance
DROP INDEX IF EXISTS idx_bookings_services_id;
CREATE INDEX idx_bookings_services_id ON bookings(services_id);

-- Check if there are any other columns with character varying(10) that might be causing issues
DO $$
DECLARE
    col_info RECORD;
BEGIN
    FOR col_info IN
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND data_type = 'character varying'
        AND character_maximum_length = 10
    LOOP
        RAISE NOTICE 'Column % is character varying(10)', col_info.column_name;
    END LOOP;
END $$;
