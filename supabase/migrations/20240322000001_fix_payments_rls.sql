-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON payments;

-- Create policy to allow authenticated users to insert into payments table
CREATE POLICY "Allow insert for authenticated users"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow users to view their own payments
DROP POLICY IF EXISTS "Allow users to view their own payments" ON payments;
CREATE POLICY "Allow users to view their own payments"
ON payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'user_id') THEN
        ALTER TABLE payments ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END
$$;
