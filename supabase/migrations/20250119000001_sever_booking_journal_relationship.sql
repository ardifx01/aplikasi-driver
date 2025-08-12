-- Remove the relationship between bookings and journal entries

-- Drop the foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_journal_entry' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT fk_bookings_journal_entry;
    END IF;
END $$;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_bookings_journal_entry_id;

-- Remove the journal_entry_id column from bookings table
ALTER TABLE bookings DROP COLUMN IF EXISTS journal_entry_id;

-- Update the create_booking_with_journal_entry function to only create bookings
CREATE OR REPLACE FUNCTION create_booking_with_journal_entry(
  p_vehicle_id UUID,
  p_driver_option TEXT,
  p_vehicle_type TEXT,
  p_booking_date DATE,
  p_start_time TIME,
  p_return_time TIME,
  p_duration INTEGER,
  p_total_amount NUMERIC,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID,
  p_vehicle_name TEXT,
  p_services_id UUID,
  p_partner_id UUID,
  p_account_id UUID DEFAULT 'b98f49fb-54c1-487d-943a-7840621f0b6e'::UUID,
  p_driver_name TEXT DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL
)
RETURNS TABLE(
  booking_id UUID,
  journal_entry_id UUID,
  status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Generate new booking ID
  v_booking_id := gen_random_uuid();
  
  -- Create the booking without journal entry
  INSERT INTO bookings (
    id,
    vehicle_id,
    driver_option,
    vehicle_type,
    booking_date,
    start_time,
    return_time,
    duration,
    status,
    payment_status,
    payment_method,
    total_amount,
    paid_amount,
    remaining_payments,
    start_date,
    end_date,
    user_id,
    vehicle_name,
    services_id,
    partner_id,
    driver_name,
    driver_id
  ) VALUES (
    v_booking_id,
    p_vehicle_id,
    p_driver_option,
    p_vehicle_type,
    p_booking_date,
    p_start_time,
    p_return_time,
    p_duration,
    'pending',
    'unpaid',
    'Cash',
    p_total_amount,
    0,
    p_total_amount,
    p_start_date,
    p_end_date,
    p_user_id,
    p_vehicle_name,
    p_services_id,
    p_partner_id,
    p_driver_name,
    p_driver_id
  );
  
  -- Return the results (no journal entry created)
  RETURN QUERY SELECT 
    v_booking_id as booking_id,
    NULL::UUID as journal_entry_id,
    'SUCCESS'::TEXT as status;
    
EXCEPTION WHEN OTHERS THEN
  -- Log error for debugging
  INSERT INTO debug_log(message, data) VALUES (
    'Error in create_booking_with_journal_entry', 
    jsonb_build_object(
      'error', SQLERRM,
      'vehicle_id', p_vehicle_id,
      'user_id', p_user_id
    )
  );
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Update the simplified function as well
CREATE OR REPLACE FUNCTION create_booking_simple(
  p_vehicle_id UUID,
  p_driver_option TEXT,
  p_vehicle_type TEXT,
  p_booking_date DATE,
  p_start_time TIME,
  p_return_time TIME,
  p_duration INTEGER,
  p_total_amount NUMERIC,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID,
  p_vehicle_name TEXT,
  p_services_id UUID DEFAULT '60ec9e54-32fc-49de-acf4-04e5980198e1'::UUID,
  p_partner_id UUID DEFAULT 'e025c00a-908f-40d3-9e03-1efa40f96951'::UUID,
  p_account_id UUID DEFAULT 'b98f49fb-54c1-487d-943a-7840621f0b6e'::UUID,
  p_driver_name TEXT DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Generate new booking ID
  v_booking_id := gen_random_uuid();
  
  -- Create the booking directly without journal entry
  INSERT INTO bookings (
    id,
    vehicle_id,
    driver_option,
    vehicle_type,
    booking_date,
    start_time,
    return_time,
    duration,
    status,
    payment_status,
    payment_method,
    total_amount,
    paid_amount,
    remaining_payments,
    start_date,
    end_date,
    user_id,
    vehicle_name,
    services_id,
    partner_id,
    driver_name,
    driver_id
  ) VALUES (
    v_booking_id,
    p_vehicle_id,
    p_driver_option,
    p_vehicle_type,
    p_booking_date,
    p_start_time,
    p_return_time,
    p_duration,
    'pending',
    'unpaid',
    'Cash',
    p_total_amount,
    0,
    p_total_amount,
    p_start_date,
    p_end_date,
    p_user_id,
    p_vehicle_name,
    p_services_id,
    p_partner_id,
    p_driver_name,
    p_driver_id
  );
  
  -- Return just the booking ID
  RETURN v_booking_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_booking_with_journal_entry TO authenticated;
GRANT EXECUTE ON FUNCTION create_booking_simple TO authenticated;
