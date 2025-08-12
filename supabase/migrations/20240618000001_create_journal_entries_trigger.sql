-- Create chart_of_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code VARCHAR(20) NOT NULL UNIQUE,
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  is_debit NUMERIC(1,0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default chart of accounts if they don't exist
INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_debit)
VALUES 
('1-10001', 'Cash', 'Asset', 1),
('1-10002', 'Accounts Receivable', 'Asset', 1),
('4-40001', 'Rental Revenue', 'Revenue', 0),
('2-20001', 'Unearned Revenue', 'Liability', 0)
ON CONFLICT (account_code) DO NOTHING;

-- Create general_ledger table if it doesn't exist
CREATE TABLE IF NOT EXISTS general_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL,
  booking_id UUID,
  payment_id UUID,
  account_id UUID REFERENCES chart_of_accounts(id) NOT NULL,
  description TEXT NOT NULL,
  debit DECIMAL(12, 2) DEFAULT 0,
  credit DECIMAL(12, 2) DEFAULT 0,
  reference_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table to group related general_ledger entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date DATE NOT NULL,
  booking_id UUID,
  payment_id UUID,
  entry_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  reference_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to handle booking and payment journal entries
CREATE OR REPLACE FUNCTION create_booking_journal_entries()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_entry_id UUID;
  v_cash_account_id UUID;
  v_ar_account_id UUID;
  v_revenue_account_id UUID;
  v_unearned_revenue_id UUID;
  v_reference_number VARCHAR(50);
  v_description TEXT;
  v_entry_type VARCHAR(50);
  v_vehicle_name TEXT;
BEGIN
  -- Get account IDs
  SELECT id INTO v_cash_account_id FROM chart_of_accounts WHERE account_code = '1-10001';
  SELECT id INTO v_ar_account_id FROM chart_of_accounts WHERE account_code = '1-10002';
  SELECT id INTO v_revenue_account_id FROM chart_of_accounts WHERE account_code = '4-40001';
  SELECT id INTO v_unearned_revenue_id FROM chart_of_accounts WHERE account_code = '2-20001';
  
  -- Override with specific account IDs as requested
  v_ar_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca'; -- For debit side
  v_unearned_revenue_id := '60ec9e54-32fc-49de-acf4-04e5980198e1'; -- For credit side
  
  -- Get vehicle name for better description
  SELECT vehicle_name INTO v_vehicle_name FROM bookings WHERE id = NEW.id;
  -- If vehicle not found, use a default value
  IF v_vehicle_name IS NULL THEN
    v_vehicle_name := 'unknown vehicle';
  END IF;
  
  -- Generate reference number
  v_reference_number := 'BK-' || NEW.id;
  
  -- Handle INSERT (new booking)
  IF TG_OP = 'INSERT' THEN
    -- Create journal entry for new booking (unpaid)
    v_description := 'Booking created for ' || COALESCE(v_vehicle_name, 'vehicle') || ' (Unpaid)';
    v_entry_type := 'BOOKING_CREATED';
    
    -- Insert journal entry header
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_entry_type, v_description, NEW.total_amount, v_reference_number
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries
    -- Debit Accounts Receivable
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_ar_account_id, v_description, NEW.total_amount, 0, v_reference_number
    );
    
    -- Credit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_unearned_revenue_id, v_description, 0, NEW.total_amount, v_reference_number
    );
    
  -- Handle UPDATE (payment status change)
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status = 'unpaid' AND NEW.payment_status = 'paid' THEN
    -- Create journal entry for payment received
    v_description := 'Payment received for ' || COALESCE(v_vehicle_name, 'vehicle') || ' booking';
    v_entry_type := 'PAYMENT_RECEIVED';
    
    -- Insert journal entry header
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_entry_type, v_description, NEW.total_amount, v_reference_number
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries
    -- Debit Cash
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_cash_account_id, v_description, NEW.total_amount, 0, v_reference_number
    );
    
    -- Credit Accounts Receivable
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_ar_account_id, v_description, 0, NEW.total_amount, v_reference_number
    );
    
    -- Debit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_unearned_revenue_id, v_description, NEW.total_amount, 0, v_reference_number
    );
    
    -- Credit Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_revenue_account_id, v_description, 0, NEW.total_amount, v_reference_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle partial payment journal entries
CREATE OR REPLACE FUNCTION create_payment_journal_entries()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_entry_id UUID;
  v_cash_account_id UUID;
  v_ar_account_id UUID;
  v_revenue_account_id UUID;
  v_unearned_revenue_id UUID;
  v_reference_number VARCHAR(50);
  v_description TEXT;
  v_entry_type VARCHAR(50);
  v_booking_id UUID;
  v_vehicle_name TEXT;
  v_payment_amount DECIMAL(12, 2);
  v_total_amount DECIMAL(12, 2);
  v_is_full_payment BOOLEAN;
BEGIN
  -- Get account IDs
  SELECT id INTO v_cash_account_id FROM chart_of_accounts WHERE account_code = '1-10001';
  SELECT id INTO v_ar_account_id FROM chart_of_accounts WHERE account_code = '1-10002';
  SELECT id INTO v_revenue_account_id FROM chart_of_accounts WHERE account_code = '4-40001';
  SELECT id INTO v_unearned_revenue_id FROM chart_of_accounts WHERE account_code = '2-20001';
  
  -- Override with specific account IDs as requested
  v_ar_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca'; -- For debit side
  v_unearned_revenue_id := '60ec9e54-32fc-49de-acf4-04e5980198e1'; -- For credit side
  
  -- Set default values
  v_booking_id := NULL;
  v_vehicle_name := 'unknown vehicle';
  v_total_amount := NEW.amount;
  v_is_full_payment := FALSE;
  
  -- Check if booking_id column exists in the payments table
  BEGIN
    -- Get booking information if booking_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'booking_id') THEN
      IF NEW.booking_id IS NOT NULL THEN
        SELECT b.id, b.vehicle_name, b.total_amount INTO v_booking_id, v_vehicle_name, v_total_amount 
        FROM bookings b WHERE b.id = NEW.booking_id;
        
        -- Check if this is a full payment
        SELECT (NEW.amount >= b.total_amount - COALESCE(b.paid_amount, 0)) INTO v_is_full_payment 
        FROM bookings b WHERE b.id = NEW.booking_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, use default values
    v_booking_id := NULL;
    v_vehicle_name := 'unknown vehicle';
    v_total_amount := NEW.amount;
    v_is_full_payment := FALSE;
  END;
  
  -- Set payment amount
  v_payment_amount := NEW.amount;
  
  -- Generate reference number
  v_reference_number := 'PMT-' || NEW.id;
  
  -- Create journal entry for payment
  v_description := 'Payment for ' || COALESCE(v_vehicle_name, 'vehicle') || ' booking';
  v_entry_type := CASE WHEN v_is_full_payment THEN 'FULL_PAYMENT' ELSE 'PARTIAL_PAYMENT' END;
  
  -- Insert journal entry header
  INSERT INTO journal_entries (
    entry_date, booking_id, payment_id, entry_type, description, total_amount, reference_number
  ) VALUES (
    CURRENT_DATE, v_booking_id, NEW.id, v_entry_type, v_description, v_payment_amount, v_reference_number
  ) RETURNING id INTO v_journal_entry_id;
  
  -- Insert general ledger entries
  -- Debit Cash
  INSERT INTO general_ledger (
    transaction_date, booking_id, payment_id, account_id, description, debit, credit, reference_number
  ) VALUES (
    CURRENT_DATE, v_booking_id, NEW.id, v_cash_account_id, v_description, v_payment_amount, 0, v_reference_number
  );
  
  -- Credit Accounts Receivable
  INSERT INTO general_ledger (
    transaction_date, booking_id, payment_id, account_id, description, debit, credit, reference_number
  ) VALUES (
    CURRENT_DATE, v_booking_id, NEW.id, v_ar_account_id, v_description, 0, v_payment_amount, v_reference_number
  );
  
  -- If full payment, recognize revenue
  IF v_is_full_payment THEN
    -- Debit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, payment_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, v_booking_id, NEW.id, v_unearned_revenue_id, v_description, v_total_amount, 0, v_reference_number
    );
    
    -- Credit Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, payment_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, v_booking_id, NEW.id, v_revenue_account_id, v_description, 0, v_total_amount, v_reference_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
-- Trigger for bookings table
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();

-- Trigger for payments table
DROP TRIGGER IF EXISTS payment_journal_entries_trigger ON payments;
CREATE TRIGGER payment_journal_entries_trigger
AFTER INSERT
ON payments
FOR EACH ROW
EXECUTE FUNCTION create_payment_journal_entries();

-- Enable row level security on new tables
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for chart_of_accounts
DROP POLICY IF EXISTS "Admin can manage chart_of_accounts" ON chart_of_accounts;
CREATE POLICY "Admin can manage chart_of_accounts"
ON chart_of_accounts FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view chart_of_accounts" ON chart_of_accounts;
CREATE POLICY "Users can view chart_of_accounts"
ON chart_of_accounts FOR SELECT
USING (true);

-- Create policies for general_ledger
DROP POLICY IF EXISTS "Admin can manage general_ledger" ON general_ledger;
CREATE POLICY "Admin can manage general_ledger"
ON general_ledger FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view their own general_ledger entries" ON general_ledger;
CREATE POLICY "Users can view their own general_ledger entries"
ON general_ledger FOR SELECT
USING (
  booking_id IS NULL OR booking_id IN (
    SELECT id FROM bookings WHERE user_id = auth.uid()
  )
);

-- Create policies for journal_entries
DROP POLICY IF EXISTS "Admin can manage journal_entries" ON journal_entries;
CREATE POLICY "Admin can manage journal_entries"
ON journal_entries FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view their own journal_entries" ON journal_entries;
CREATE POLICY "Users can view their own journal_entries"
ON journal_entries FOR SELECT
USING (
  booking_id IS NULL OR booking_id IN (
    SELECT id FROM bookings WHERE user_id = auth.uid()
  )
);

-- Add tables to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chart_of_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chart_of_accounts;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'general_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE general_ledger;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'journal_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
  END IF;
END
$$;