-- First, check what the constraint actually requires
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'journal_entries_entry_type_check';

-- Drop existing triggers to avoid conflicts during updates
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;

-- Drop existing function
DROP FUNCTION IF EXISTS create_booking_journal_entries;

-- CRITICAL FIX: First, modify the constraint to allow our valid values
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_entry_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_entry_type_check 
  CHECK (entry_type IN ('BOOKING_CREATED', 'PAYMENT_RECEIVED'));

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
  v_current_date DATE;
BEGIN
  -- Set current date
  v_current_date := CURRENT_DATE;
  
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
  
  -- CRITICAL FIX: Always explicitly set entry_type before using it
  -- Handle INSERT (new booking)
  IF TG_OP = 'INSERT' THEN
    -- Always explicitly set entry_type for new bookings
    v_entry_type := 'BOOKING_CREATED';
    
    -- Create journal entry for new booking (unpaid)
    v_description := 'Booking created for ' || COALESCE(v_vehicle_name, 'vehicle') || ' (Unpaid)';
    
    -- CRITICAL FIX: Use direct string literal instead of variable to ensure constraint is satisfied
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, 'BOOKING_CREATED', v_description, NEW.total_amount, v_reference_number, v_current_date
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries
    -- Debit Accounts Receivable
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, v_ar_account_id, v_description, NEW.total_amount, 0, v_reference_number, v_current_date
    );
    
    -- Credit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, v_unearned_revenue_id, v_description, 0, NEW.total_amount, v_reference_number, v_current_date
    );
    
  -- Handle UPDATE (payment status change)
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status = 'unpaid' AND NEW.payment_status = 'paid' THEN
    -- Always explicitly set entry_type for payment updates
    v_entry_type := 'PAYMENT_RECEIVED';
    
    -- Create journal entry for payment received
    v_description := 'Payment received for ' || COALESCE(v_vehicle_name, 'vehicle') || ' booking';
    
    -- CRITICAL FIX: Use direct string literal instead of variable to ensure constraint is satisfied
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, 'PAYMENT_RECEIVED', v_description, NEW.total_amount, v_reference_number, v_current_date
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries
    -- Debit Cash
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, v_cash_account_id, v_description, NEW.total_amount, 0, v_reference_number, v_current_date
    );
    
    -- Credit Accounts Receivable
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, v_ar_account_id, v_description, 0, NEW.total_amount, v_reference_number, v_current_date
    );
    
    -- Debit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, v_unearned_revenue_id, v_description, NEW.total_amount, 0, v_reference_number, v_current_date
    );
    
    -- Credit Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      v_current_date, NEW.id, v_revenue_account_id, v_description, 0, NEW.total_amount, v_reference_number, v_current_date
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();

-- Check if there are any existing journal entries with NULL entry_type and fix them
UPDATE journal_entries 
SET entry_type = 'BOOKING_CREATED' 
WHERE entry_type IS NULL;

-- CRITICAL FIX: Make entry_type NOT NULL to prevent future issues
ALTER TABLE journal_entries ALTER COLUMN entry_type SET NOT NULL;

-- Verify the constraint definition
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'journal_entries_entry_type_check';
