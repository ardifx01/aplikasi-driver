-- Fix the journal_entries_entry_type_check constraint issue

-- First, drop existing triggers to avoid conflicts during updates
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;
DROP TRIGGER IF EXISTS payment_journal_entries_trigger ON payments;

-- Drop existing functions
DROP FUNCTION IF EXISTS create_booking_journal_entries;
DROP FUNCTION IF EXISTS create_payment_journal_entries;

-- Check if the constraint exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journal_entries_entry_type_check') THEN
    ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_entry_type_check;
  END IF;
END
$$;

-- Add a check constraint with valid entry types
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_entry_type_check 
  CHECK (entry_type IN ('BOOKING_CREATED', 'PAYMENT_RECEIVED', 'FULL_PAYMENT', 'PARTIAL_PAYMENT'));

-- Create function to handle booking journal entries with proper entry_type values
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

-- Create function to handle payment journal entries with proper entry_type values
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
  v_has_booking_id BOOLEAN;
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
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'booking_id'
  ) INTO v_has_booking_id;
  
  -- Only try to access booking_id if the column exists
  IF v_has_booking_id THEN
    BEGIN
      -- Use dynamic SQL to safely check if NEW.booking_id exists and is not null
      EXECUTE 'SELECT $1.booking_id' USING NEW INTO v_booking_id;
      
      IF v_booking_id IS NOT NULL THEN
        -- Get booking information
        SELECT b.id, b.vehicle_name, b.total_amount 
        INTO v_booking_id, v_vehicle_name, v_total_amount 
        FROM bookings b 
        WHERE b.id = v_booking_id;
        
        -- Check if this is a full payment
        SELECT (NEW.amount >= b.total_amount - COALESCE(b.paid_amount, 0)) 
        INTO v_is_full_payment 
        FROM bookings b 
        WHERE b.id = v_booking_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If any error occurs, use default values
      v_booking_id := NULL;
      v_vehicle_name := 'unknown vehicle';
      v_total_amount := NEW.amount;
      v_is_full_payment := FALSE;
    END;
  END IF;
  
  -- Set payment amount
  v_payment_amount := NEW.amount;
  
  -- Generate reference number
  v_reference_number := 'PMT-' || NEW.id;
  
  -- Create journal entry for payment
  v_description := 'Payment for ' || COALESCE(v_vehicle_name, 'vehicle') || ' booking';
  
  -- Ensure entry_type is always set to a valid value
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
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();

-- Trigger for payments table
CREATE TRIGGER payment_journal_entries_trigger
AFTER INSERT
ON payments
FOR EACH ROW
EXECUTE FUNCTION create_payment_journal_entries();