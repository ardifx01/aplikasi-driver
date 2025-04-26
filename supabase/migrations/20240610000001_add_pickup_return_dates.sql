-- Add pickup_date and return_date columns to bookings table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'pickup_date') THEN
        ALTER TABLE bookings ADD COLUMN pickup_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'return_date') THEN
        ALTER TABLE bookings ADD COLUMN return_date DATE;
    END IF;
END $$;
