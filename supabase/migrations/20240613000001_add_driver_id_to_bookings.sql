-- Add driver_id column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES auth.users(id);
-- Add driver_name column to bookings table for storing the name when driver option is selected
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_name TEXT;
-- Update the realtime publication
-- This is commented out because the relation is already a member of the publication
-- alter publication supabase_realtime add table bookings;
