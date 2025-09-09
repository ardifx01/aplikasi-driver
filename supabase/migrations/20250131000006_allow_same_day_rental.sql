-- Allow same-day rentals by removing constraints that prevent end_time = start_time
-- Drop any constraints that enforce end_date > start_date
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_end_date_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_end_date_after_start;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_date_range_check;

-- Update the backdate booking trigger to handle same-day rentals properly
CREATE OR REPLACE FUNCTION check_backdate_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_backdated flag if start_date is in the past
  IF NEW.start_date < CURRENT_DATE THEN
    NEW.is_backdated = TRUE;
  ELSE
    NEW.is_backdated = FALSE;
  END IF;
  
  -- Calculate duration properly for same-day rentals
  -- If end_date = start_date, duration should be 1 day
  IF NEW.end_date = NEW.start_date THEN
    NEW.duration = 1;
  ELSE
    NEW.duration = GREATEST(1, NEW.end_date - NEW.start_date + 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate rental days on server side
CREATE OR REPLACE FUNCTION calculate_rental_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
  -- For same-day rental, return 1 day
  IF end_date = start_date THEN
    RETURN 1;
  END IF;
  
  -- For multi-day rental, calculate difference + 1
  RETURN GREATEST(1, end_date - start_date + 1);
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow same-day rentals
DROP POLICY IF EXISTS "Users can insert bookings with backdate restrictions" ON bookings;

CREATE POLICY "Users can insert bookings with backdate restrictions"
ON bookings FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    -- Regular users can book future dates or same day
    (start_date >= CURRENT_DATE AND end_date >= start_date) OR
    -- Admin/dispatcher can book any date (including past dates)
    EXISTS (
      SELECT 1 FROM drivers 
      WHERE drivers.id = auth.uid() 
      AND drivers.role_name IN ('admin', 'dispatcher', 'super_admin')
    )
  )
);