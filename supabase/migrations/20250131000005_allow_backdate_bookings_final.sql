-- Drop CHECK constraint that enforces start_time >= now()
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_start_time_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_start_time_future;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_start_date_check;

-- Add is_backdated column to track backdated bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_backdated BOOLEAN DEFAULT FALSE;

-- Create function to check if booking is backdated
CREATE OR REPLACE FUNCTION check_backdate_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_backdated flag if start_date is in the past
  IF NEW.start_date < CURRENT_DATE THEN
    NEW.is_backdated = TRUE;
  ELSE
    NEW.is_backdated = FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set is_backdated flag
DROP TRIGGER IF EXISTS trigger_check_backdate_booking ON bookings;
CREATE TRIGGER trigger_check_backdate_booking
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_backdate_booking();

-- Enable RLS on bookings table if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Backdate booking policy" ON bookings;
DROP POLICY IF EXISTS "Users can insert bookings with backdate restrictions" ON bookings;
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;

-- Policy for viewing bookings
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = auth.uid() 
    AND drivers.role_name IN ('admin', 'dispatcher', 'super_admin')
  )
);

-- Policy for inserting bookings (including backdated ones for admin/dispatcher)
CREATE POLICY "Users can insert bookings with backdate restrictions"
ON bookings FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    -- Regular users can only book future dates
    (start_date >= CURRENT_DATE) OR
    -- Admin/dispatcher can book any date (including past dates)
    EXISTS (
      SELECT 1 FROM drivers 
      WHERE drivers.id = auth.uid() 
      AND drivers.role_name IN ('admin', 'dispatcher', 'super_admin')
    )
  )
);

-- Policy for updating bookings
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = auth.uid() 
    AND drivers.role_name IN ('admin', 'dispatcher', 'super_admin')
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = auth.uid() 
    AND drivers.role_name IN ('admin', 'dispatcher', 'super_admin')
  )
);

-- Policy for deleting bookings
CREATE POLICY "Admin can delete bookings"
ON bookings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = auth.uid() 
    AND drivers.role_name IN ('admin', 'dispatcher', 'super_admin')
  )
);