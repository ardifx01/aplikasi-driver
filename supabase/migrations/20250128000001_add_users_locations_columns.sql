-- Add new columns to users_locations table if they don't exist
ALTER TABLE public.users_locations 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS location_zone TEXT,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_locations_user_id ON public.users_locations(user_id);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_locations_status ON public.users_locations(status);

-- Enable realtime for users_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE users_locations;
