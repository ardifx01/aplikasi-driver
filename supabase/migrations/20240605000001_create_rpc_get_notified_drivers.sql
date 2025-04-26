-- Create a function to get notified drivers for airport transfers
CREATE OR REPLACE FUNCTION get_notified_drivers_for_airport_transfer(booking_code TEXT)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  phone TEXT,
  email TEXT,
  distance FLOAT,
  is_available BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the booking exists
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE id = booking_code::uuid) THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Return drivers who should be notified about this airport transfer
  -- This is a simplified example - in a real implementation, you would have more complex logic
  -- such as finding drivers within a certain distance, with appropriate vehicle types, etc.
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.phone_number as phone,
    d.email,
    0.0 as distance, -- Placeholder for actual distance calculation
    TRUE as is_available -- Placeholder for actual availability check
  FROM 
    drivers d
  WHERE 
    d.role = 'driver'
  LIMIT 5; -- Limit to 5 drivers for demonstration

END;
$$;
