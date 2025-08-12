-- Drop the existing services_id column and recreate it as UUID
ALTER TABLE bookings DROP COLUMN IF EXISTS services_id;
ALTER TABLE bookings ADD COLUMN services_id UUID;

-- Add an index on the services_id column for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_services_id ON bookings(services_id);

-- Verify the column type
DO $$
BEGIN
    RAISE NOTICE 'services_id column type: %', pg_typeof((SELECT services_id FROM bookings LIMIT 1));
END $$;