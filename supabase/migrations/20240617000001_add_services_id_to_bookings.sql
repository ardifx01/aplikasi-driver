-- First create the services_id table if it doesn't exist
CREATE TABLE IF NOT EXISTS services_id (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the specific service ID if it doesn't exist
INSERT INTO services_id (id, name)
VALUES ('60ec9e54-32fc-49de-acf4-04e5980198e1', 'Default Service')
ON CONFLICT (id) DO NOTHING;

-- Add services_id column to bookings table if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'services_id') THEN
    ALTER TABLE bookings ADD COLUMN services_id UUID REFERENCES services_id(id);
  END IF;
END $$;

-- Enable realtime for the services_id table (only if not already a member)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'services_id'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE services_id';
  END IF;
END $;
