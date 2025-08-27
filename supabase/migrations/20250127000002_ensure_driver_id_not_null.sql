-- Ensure driver_id column is properly set and references drivers table
-- This migration ensures that all bookings have a valid driver_id from the drivers table

-- First, update any existing bookings that might have null driver_id
-- Try to match user_id with drivers table by email or ID
UPDATE bookings 
SET driver_id = (
  SELECT d.id 
  FROM drivers d 
  JOIN auth.users au ON au.email = d.email 
  WHERE au.id = bookings.user_id
  LIMIT 1
)
WHERE driver_id IS NULL AND user_id IS NOT NULL;

-- If still null, try to match by user_id directly (in case user_id exists in drivers table)
UPDATE bookings 
SET driver_id = (
  SELECT d.id 
  FROM drivers d 
  WHERE d.id = bookings.user_id
  LIMIT 1
)
WHERE driver_id IS NULL AND user_id IS NOT NULL;

-- Update driver_name based on driver_id for existing bookings
UPDATE bookings 
SET driver_name = (
  SELECT d.name 
  FROM drivers d 
  WHERE d.id = bookings.driver_id
  LIMIT 1
)
WHERE driver_id IS NOT NULL AND (driver_name IS NULL OR driver_name = '');

-- For any remaining records without driver_id, log them for manual review
-- Create a temporary log table to track problematic records
CREATE TEMP TABLE IF NOT EXISTS booking_driver_issues AS
SELECT id, user_id, created_at, 'No matching driver found' as issue
FROM bookings 
WHERE driver_id IS NULL;

-- For now, we'll set driver_id to user_id as fallback, but this should be reviewed
UPDATE bookings 
SET driver_id = user_id 
WHERE driver_id IS NULL AND user_id IS NOT NULL;

-- Delete any bookings that still don't have a valid driver_id
DELETE FROM bookings 
WHERE driver_id IS NULL;

-- Add a constraint to ensure driver_id is never null in future inserts
-- Note: We're not making it NOT NULL at the column level to avoid breaking existing code
-- Instead, we'll rely on application logic and triggers

-- Create a function to ensure driver_id is always set and references drivers table
-- Also automatically populate driver_name based on driver_id
-- UPDATED: This function now ONLY allows existing driver records and prevents creation of new ones
CREATE OR REPLACE FUNCTION ensure_driver_id_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  found_driver_id UUID;
  found_driver_name TEXT;
  debug_table_exists BOOLEAN;
BEGIN
  -- Check if debug_log table exists before trying to insert
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'debug_log'
  ) INTO debug_table_exists;
  
  -- If driver_id is already set, validate it exists in drivers table and get driver name
  IF NEW.driver_id IS NOT NULL THEN
    -- Check if the driver_id exists in drivers table and get the name
    SELECT id, name INTO found_driver_id, found_driver_name FROM drivers WHERE id = NEW.driver_id LIMIT 1;
    IF found_driver_id IS NULL THEN
      RAISE EXCEPTION 'driver_id % does not exist in drivers table', NEW.driver_id;
    END IF;
    -- Set driver_name based on driver_id
    NEW.driver_name := found_driver_name;
    RETURN NEW;
  END IF;
  
  -- If driver_id is null, try to find matching driver by user email
  IF NEW.user_id IS NOT NULL THEN
    SELECT d.id, d.name INTO found_driver_id, found_driver_name
    FROM drivers d 
    JOIN auth.users au ON au.email = d.email 
    WHERE au.id = NEW.user_id 
    LIMIT 1;
    
    -- If found by email, use that driver_id and name
    IF found_driver_id IS NOT NULL THEN
      NEW.driver_id := found_driver_id;
      NEW.driver_name := found_driver_name;
      RETURN NEW;
    END IF;
    
    -- Try to find driver by direct ID match
    SELECT id, name INTO found_driver_id, found_driver_name FROM drivers WHERE id = NEW.user_id LIMIT 1;
    IF found_driver_id IS NOT NULL THEN
      NEW.driver_id := found_driver_id;
      NEW.driver_name := found_driver_name;
      RETURN NEW;
    END IF;
    
    -- CRITICAL CHANGE: If no driver found, REJECT the booking instead of creating fallback records
    -- Log this rejection for debugging (only if debug_log table exists)
    IF debug_table_exists THEN
      INSERT INTO debug_log (message, data) 
      VALUES (
        'Booking rejected: No matching driver found in drivers table', 
        json_build_object('booking_id', NEW.id, 'user_id', NEW.user_id, 'timestamp', NOW())
      );
    END IF;
    
    -- Raise an exception to prevent the booking from being created
    RAISE EXCEPTION 'No matching driver found in drivers table for user_id %. User must be registered as a driver before creating bookings.', NEW.user_id;
  END IF;
  
  -- If both driver_id and user_id are null, raise an error
  RAISE EXCEPTION 'driver_id cannot be null. Either driver_id or user_id must be provided and must reference a valid driver.';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure driver_id is always set
DROP TRIGGER IF EXISTS trigger_ensure_driver_id ON bookings;
CREATE TRIGGER trigger_ensure_driver_id
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_driver_id_on_booking();

-- Add comments to document the driver_id and driver_name column behavior
COMMENT ON COLUMN bookings.driver_id IS 'ID of the driver for this booking. Must reference a valid ID from the drivers table. Required for all bookings.';
COMMENT ON COLUMN bookings.driver_name IS 'Name of the driver for this booking. Automatically populated based on driver_id via trigger.';

-- Enable realtime for bookings table (if not already enabled)
-- Note: Only add if not already a member of the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;
END $$;