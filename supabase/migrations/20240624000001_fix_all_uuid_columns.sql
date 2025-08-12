-- Check all columns in bookings table that might be causing the issue
DO $$
DECLARE
    col_info RECORD;
BEGIN
    FOR col_info IN
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND data_type = 'character varying'
        AND character_maximum_length < 36
    LOOP
        RAISE NOTICE 'Column % is character varying(%) - too small for UUID', col_info.column_name, col_info.character_maximum_length;
        
        -- Alter the column to be UUID type if it's likely to contain UUIDs
        IF col_info.column_name IN ('services_id', 'partner_id', 'vehicle_id', 'user_id', 'driver_id') THEN
            EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I TYPE UUID USING %I::uuid', col_info.column_name, col_info.column_name);
            RAISE NOTICE 'Converted column % to UUID type', col_info.column_name;
        END IF;
    END LOOP;
    
    -- Specifically check and fix services_id and partner_id
    -- First check if services_id exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'services_id'
    ) THEN
        -- Drop and recreate as UUID
        ALTER TABLE bookings DROP COLUMN IF EXISTS services_id;
        ALTER TABLE bookings ADD COLUMN services_id UUID;
        RAISE NOTICE 'Recreated services_id as UUID';
    END IF;
    
    -- Check if partner_id exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'partner_id'
    ) THEN
        -- Drop and recreate as UUID
        ALTER TABLE bookings DROP COLUMN IF EXISTS partner_id;
        ALTER TABLE bookings ADD COLUMN partner_id UUID;
        RAISE NOTICE 'Recreated partner_id as UUID';
    END IF;
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_bookings_services_id ON bookings(services_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
    
    -- Final verification
    RAISE NOTICE 'Final column types:';
    FOR col_info IN
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name IN ('services_id', 'partner_id', 'vehicle_id', 'user_id', 'driver_id')
    LOOP
        RAISE NOTICE 'Column %: % (max length: %)', 
            col_info.column_name, 
            col_info.data_type, 
            col_info.character_maximum_length;
    END LOOP;
END $$;