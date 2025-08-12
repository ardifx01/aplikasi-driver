-- Create a function to handle booking creation with journal entry
-- This function creates a booking and its corresponding journal entry in a single transaction

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
  v_journal_entry_id UUID;
  v_reference_number TEXT;
BEGIN
  -- Generate new booking ID
  v_booking_id := gen_random_uuid();
  
  -- Create the booking
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
  
  -- Generate reference number
  v_reference_number := 'BK-' || UPPER(SUBSTRING(v_booking_id::TEXT, 1, 8));
  
  -- Create journal entry for the booking
  INSERT INTO journal_entries (
    entry_date,
    booking_id,
    entry_type,
    description,
    total_amount,
    reference_number,
    date,
    account_id
  ) VALUES (
    CURRENT_DATE,
    v_booking_id,
    'BOOKING_CREATED',
    'Booking created for ' || p_vehicle_name || ' - ' || p_driver_option,
    p_total_amount,
    v_reference_number,
    CURRENT_DATE,
    p_account_id
  ) RETURNING id INTO v_journal_entry_id;
  
  -- Return the results
  RETURN QUERY SELECT 
    v_booking_id as booking_id,
    v_journal_entry_id as journal_entry_id,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_booking_with_journal_entry TO authenticated;

-- Create a simplified function for frontend use
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
  v_result RECORD;
BEGIN
  -- Call the main function
  SELECT * INTO v_result FROM create_booking_with_journal_entry(
    p_vehicle_id,
    p_driver_option,
    p_vehicle_type,
    p_booking_date,
    p_start_time,
    p_return_time,
    p_duration,
    p_total_amount,
    p_start_date,
    p_end_date,
    p_user_id,
    p_vehicle_name,
    p_services_id,
    p_partner_id,
    p_account_id,
    p_driver_name,
    p_driver_id
  );
  
  -- Return just the booking ID
  RETURN v_result.booking_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_booking_simple TO authenticated;
