-- Remove the problematic unique constraint on total_amount in bookings table
-- Multiple bookings can legitimately have the same total amount

-- Drop the unique constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_total_amount_key' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_total_amount_key;
    
    -- Log the constraint removal
    INSERT INTO debug_log(message, data) VALUES (
      'Removed unique constraint on bookings.total_amount',
      jsonb_build_object(
        'constraint_name', 'bookings_total_amount_key',
        'table_name', 'bookings',
        'reason', 'Multiple bookings can have the same total amount'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't fail the migration
  INSERT INTO debug_log(message, data) VALUES (
    'Error removing unique constraint on bookings.total_amount',
    jsonb_build_object(
      'error', SQLERRM,
      'constraint_name', 'bookings_total_amount_key'
    )
  );
END $$;

-- Ensure the bookings table is enabled for realtime
alter publication supabase_realtime add table bookings;
