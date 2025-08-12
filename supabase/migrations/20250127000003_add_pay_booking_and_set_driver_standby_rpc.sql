-- Create RPC function pay_booking_and_set_driver_standby
-- This function handles payment completion, calculates total payments, and updates driver status

CREATE OR REPLACE FUNCTION pay_booking_and_set_driver_standby(
  booking_id uuid,
  payment_amount numeric,
  method text,
  by uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id uuid;
  v_total_payments numeric := 0;
  v_booking_total_amount numeric := 0;
  v_payment_id uuid;
  v_result json;
BEGIN
  -- Get driver_id and total_amount from the booking
  SELECT driver_id, total_amount 
  INTO v_driver_id, v_booking_total_amount
  FROM bookings 
  WHERE id = booking_id;
  
  -- Check if booking exists
  IF v_driver_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or driver_id is null'
    );
  END IF;
  
  -- Insert new payment with status 'COMPLETED'
  INSERT INTO payments (
    id,
    booking_id,
    amount,
    payment_method,
    payment_status,
    user_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    booking_id,
    payment_amount,
    method,
    'COMPLETED',
    by,
    NOW()
  ) RETURNING id INTO v_payment_id;
  
  -- Calculate total payments for this booking
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_payments
  FROM payments 
  WHERE booking_id = booking_id 
    AND payment_status = 'COMPLETED';
  
  -- Update driver status to 'standby' in the drivers table
  UPDATE drivers 
  SET driver_status = 'standby',
      updated_at = NOW()
  WHERE id = v_driver_id;
  
  -- Log the operation for debugging
  INSERT INTO debug_log (message, data) 
  VALUES (
    'Payment completed and driver set to standby', 
    json_build_object(
      'booking_id', booking_id,
      'payment_id', v_payment_id,
      'payment_amount', payment_amount,
      'total_payments', v_total_payments,
      'booking_total_amount', v_booking_total_amount,
      'driver_id', v_driver_id,
      'payment_method', method,
      'processed_by', by,
      'timestamp', NOW()
    )
  );
  
  -- Return success result with details
  v_result := json_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'total_payments', v_total_payments,
    'booking_total_amount', v_booking_total_amount,
    'driver_id', v_driver_id,
    'driver_status_updated', true
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO debug_log (message, data) 
    VALUES (
      'Error in pay_booking_and_set_driver_standby', 
      json_build_object(
        'booking_id', booking_id,
        'payment_amount', payment_amount,
        'method', method,
        'by', by,
        'error_message', SQLERRM,
        'error_state', SQLSTATE,
        'timestamp', NOW()
      )
    );
    
    -- Return error result
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION pay_booking_and_set_driver_standby(uuid, numeric, text, uuid) TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION pay_booking_and_set_driver_standby(uuid, numeric, text, uuid) IS 'Handles payment completion, calculates total payments for a booking, and updates driver status to standby';

-- Enable realtime for payments table (if not already enabled)
alter publication supabase_realtime add table payments;

-- Enable realtime for drivers table (if not already enabled)
alter publication supabase_realtime add table drivers;
