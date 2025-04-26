-- Add user_id column to payments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'user_id') THEN
    ALTER TABLE payments ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Make sure we have the right columns for the payments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_date') THEN
    ALTER TABLE payments ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'due_date') THEN
    ALTER TABLE payments ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status') THEN
    ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add realtime support for payments table
alter publication supabase_realtime add table payments;
