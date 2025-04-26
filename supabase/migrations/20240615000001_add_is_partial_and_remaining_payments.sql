-- Add is_partial field to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;

-- Add remaining_payments field to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_payments NUMERIC DEFAULT 0;

-- Enable realtime for these tables
alter publication supabase_realtime add table payments;
