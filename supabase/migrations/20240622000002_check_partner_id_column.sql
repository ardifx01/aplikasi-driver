-- Check the partner_id column type as well
DO $$
DECLARE
    col_info RECORD;
BEGIN
    SELECT data_type, character_maximum_length 
    INTO col_info
    FROM information_schema.columns
    WHERE table_name = 'bookings'
    AND column_name = 'partner_id';
    
    RAISE NOTICE 'partner_id column type: %, length: %', col_info.data_type, col_info.character_maximum_length;
    
    -- If partner_id is also too small, fix it
    IF col_info.data_type = 'character varying' AND col_info.character_maximum_length < 36 THEN
        ALTER TABLE bookings ALTER COLUMN partner_id TYPE UUID USING partner_id::uuid;
        RAISE NOTICE 'partner_id column converted to UUID';
    END IF;
END $$;
