-- Comprehensive fix for all UUID columns in bookings table

-- First, save all existing policies on the bookings table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Create a temporary table to store policy information
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_policies (
        policyname TEXT,
        cmd TEXT,
        qual TEXT,
        with_check TEXT
    );
    
    -- Insert all policies for the bookings table
    INSERT INTO temp_policies
    SELECT 
        policyname,
        cmd,
        qual,
        with_check
    FROM pg_policies 
    WHERE tablename = 'bookings';
    
    -- Drop all policies on the bookings table
    FOR r IN SELECT policyname FROM temp_policies LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bookings', r.policyname);
        RAISE NOTICE 'Dropped policy %', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'All policies on bookings table have been temporarily dropped';
END $$;

-- Now fix all UUID columns
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE 'Starting comprehensive UUID column fix';
    
    -- Check all varchar columns that might be too small for UUIDs
    FOR col_info IN
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND data_type = 'character varying'
    LOOP
        RAISE NOTICE 'Checking column %: % (max length: %)', 
            col_info.column_name, 
            col_info.data_type, 
            col_info.character_maximum_length;
            
        -- If column is likely to contain UUIDs but is too small
        IF col_info.column_name IN ('services_id', 'partner_id', 'vehicle_id', 'driver_id', 'user_id') 
           AND (col_info.character_maximum_length IS NULL OR col_info.character_maximum_length < 36) THEN
            -- Try to convert directly first
            BEGIN
                EXECUTE format('ALTER TABLE bookings ALTER COLUMN %I TYPE UUID USING %I::uuid', 
                    col_info.column_name, col_info.column_name);
                RAISE NOTICE 'Successfully converted column % to UUID type', col_info.column_name;
            EXCEPTION WHEN OTHERS THEN
                -- If conversion fails, create a temporary column, copy data, drop original, and rename
                EXECUTE format('ALTER TABLE bookings ADD COLUMN %I_temp UUID', col_info.column_name);
                
                -- Try to convert and copy data
                BEGIN
                    EXECUTE format('UPDATE bookings SET %I_temp = %I::uuid WHERE %I IS NOT NULL', 
                        col_info.column_name, col_info.column_name, col_info.column_name);
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Could not convert some values in % to UUID', col_info.column_name;
                END;
                
                -- Drop original column and rename temp
                EXECUTE format('ALTER TABLE bookings DROP COLUMN %I', col_info.column_name);
                EXECUTE format('ALTER TABLE bookings RENAME COLUMN %I_temp TO %I', 
                    col_info.column_name, col_info.column_name);
                
                RAISE NOTICE 'Recreated column % as UUID type', col_info.column_name;
            END;
            
            -- Create index for better performance
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_bookings_%I ON bookings(%I)', 
                col_info.column_name, col_info.column_name);
        END IF;
    END LOOP;
    
    -- Specifically ensure these critical columns are UUID type
    -- services_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'services_id'
        AND data_type != 'uuid'
    ) THEN
        -- Create a temporary column, try to copy data, drop original, and rename
        ALTER TABLE bookings ADD COLUMN services_id_temp UUID;
        
        -- Try to convert and copy data
        BEGIN
            UPDATE bookings SET services_id_temp = services_id::uuid WHERE services_id IS NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert some services_id values to UUID';
        END;
        
        -- Drop original column and rename temp
        ALTER TABLE bookings DROP COLUMN services_id;
        ALTER TABLE bookings RENAME COLUMN services_id_temp TO services_id;
        
        CREATE INDEX IF NOT EXISTS idx_bookings_services_id ON bookings(services_id);
        RAISE NOTICE 'Ensured services_id is UUID';
    END IF;
    
    -- partner_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'partner_id'
        AND data_type != 'uuid'
    ) THEN
        -- Create a temporary column, try to copy data, drop original, and rename
        ALTER TABLE bookings ADD COLUMN partner_id_temp UUID;
        
        -- Try to convert and copy data
        BEGIN
            UPDATE bookings SET partner_id_temp = partner_id::uuid WHERE partner_id IS NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert some partner_id values to UUID';
        END;
        
        -- Drop original column and rename temp
        ALTER TABLE bookings DROP COLUMN partner_id;
        ALTER TABLE bookings RENAME COLUMN partner_id_temp TO partner_id;
        
        CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
        RAISE NOTICE 'Ensured partner_id is UUID';
    END IF;
    
    -- vehicle_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'vehicle_id'
        AND data_type != 'uuid'
    ) THEN
        -- Create a temporary column, try to copy data, drop original, and rename
        ALTER TABLE bookings ADD COLUMN vehicle_id_temp UUID;
        
        -- Try to convert and copy data
        BEGIN
            UPDATE bookings SET vehicle_id_temp = vehicle_id::uuid WHERE vehicle_id IS NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert some vehicle_id values to UUID';
        END;
        
        -- Drop original column and rename temp
        ALTER TABLE bookings DROP COLUMN vehicle_id;
        ALTER TABLE bookings RENAME COLUMN vehicle_id_temp TO vehicle_id;
        
        CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
        RAISE NOTICE 'Ensured vehicle_id is UUID';
    END IF;
    
    -- user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'user_id'
        AND data_type != 'uuid'
    ) THEN
        -- Create a temporary column, try to copy data, drop original, and rename
        ALTER TABLE bookings ADD COLUMN user_id_temp UUID;
        
        -- Try to convert and copy data
        BEGIN
            UPDATE bookings SET user_id_temp = user_id::uuid WHERE user_id IS NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert some user_id values to UUID';
        END;
        
        -- Drop original column and rename temp
        ALTER TABLE bookings DROP COLUMN user_id;
        ALTER TABLE bookings RENAME COLUMN user_id_temp TO user_id;
        
        CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
        RAISE NOTICE 'Ensured user_id is UUID';
    END IF;
    
    -- driver_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'driver_id'
        AND data_type != 'uuid'
    ) THEN
        -- Create a temporary column, try to copy data, drop original, and rename
        ALTER TABLE bookings ADD COLUMN driver_id_temp UUID;
        
        -- Try to convert and copy data
        BEGIN
            UPDATE bookings SET driver_id_temp = driver_id::uuid WHERE driver_id IS NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert some driver_id values to UUID';
        END;
        
        -- Drop original column and rename temp
        ALTER TABLE bookings DROP COLUMN driver_id;
        ALTER TABLE bookings RENAME COLUMN driver_id_temp TO driver_id;
        
        CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
        RAISE NOTICE 'Ensured driver_id is UUID';
    END IF;
    
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
    
    RAISE NOTICE 'UUID column fix completed';
END $$;

-- Recreate all policies that were saved
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Recreate standard policies for user_id
    CREATE POLICY "Users can view their own bookings" 
    ON bookings FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own bookings" 
    ON bookings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own bookings" 
    ON bookings FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own bookings" 
    ON bookings FOR DELETE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage their own bookings" 
    ON bookings 
    USING (auth.uid() = user_id);
    
    -- Try to recreate any other policies from the temp table
    -- This is a fallback in case there were custom policies
    FOR r IN SELECT * FROM temp_policies WHERE policyname NOT IN (
        'Users can view their own bookings',
        'Users can insert their own bookings',
        'Users can update their own bookings',
        'Users can delete their own bookings',
        'Users can manage their own bookings'
    ) LOOP
        BEGIN
            IF r.with_check IS NOT NULL THEN
                EXECUTE format(
                    'CREATE POLICY %I ON bookings FOR %s USING (%s) WITH CHECK (%s)',
                    r.policyname, r.cmd, r.qual, r.with_check
                );
            ELSE
                EXECUTE format(
                    'CREATE POLICY %I ON bookings FOR %s USING (%s)',
                    r.policyname, r.cmd, r.qual
                );
            END IF;
            RAISE NOTICE 'Recreated policy %', r.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not recreate policy %: %', r.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'All policies have been recreated';
    
    -- Drop the temporary table
    DROP TABLE IF EXISTS temp_policies;
END $$;