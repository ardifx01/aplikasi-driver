-- Add plate_number column to vehicles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'plate_number') THEN
    ALTER TABLE vehicles ADD COLUMN plate_number TEXT;
  END IF;
END $$;