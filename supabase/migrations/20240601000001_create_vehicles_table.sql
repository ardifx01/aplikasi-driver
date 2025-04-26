-- Create vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  image TEXT NOT NULL,
  pricePerHour INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Public read access" ON vehicles;
CREATE POLICY "Public read access"
ON vehicles FOR SELECT
USING (true);

-- Create policy for admin write access
DROP POLICY IF EXISTS "Admin write access" ON vehicles;
CREATE POLICY "Admin write access"
ON vehicles FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime
alter publication supabase_realtime add table vehicles;
