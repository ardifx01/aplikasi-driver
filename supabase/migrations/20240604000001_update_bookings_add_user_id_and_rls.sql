-- Add user_id column to bookings table if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable row level security on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own bookings
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
CREATE POLICY "Users can insert their own bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own bookings
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to delete their own bookings
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
CREATE POLICY "Users can delete their own bookings"
ON bookings FOR DELETE
USING (auth.uid() = user_id);

-- Create policy for admin access
DROP POLICY IF EXISTS "Admin full access" ON bookings;
CREATE POLICY "Admin full access"
ON bookings FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
