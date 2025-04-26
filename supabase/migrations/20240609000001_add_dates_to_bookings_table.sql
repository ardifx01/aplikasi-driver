-- Add start_date and end_date columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tanggal_mulai DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tanggal_selesai DATE;

-- Enable realtime for the updated table
alter publication supabase_realtime add table bookings;