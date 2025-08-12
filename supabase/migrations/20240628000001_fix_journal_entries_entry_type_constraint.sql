-- Fix the journal_entries_entry_type_check constraint issue by ensuring v_entry_type is always set to a valid value

-- First, drop existing triggers to avoid conflicts during updates
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;

-- Drop existing function
DROP FUNCTION IF EXISTS create_booking_journal_entries;

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
    -- CRITICAL FIX: Always set v_entry_type to a valid value from the constraint
    v_entry_type := 'BOOKING_CREATED';
    
    -- Create journal entry for new booking (unpaid)
    v_description := 'Booking created for ' || COALESCE(v_vehicle_name, 'vehicle') || ' (Unpaid)';
    
    -- Insert journal entry header
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_entry_type, v_description, NEW.total_amount, v_reference_number, CURRENT_DATE
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries
    -- Debit Accounts Receivable
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_ar_account_id, v_description, NEW.total_amount, 0, v_reference_number, CURRENT_DATE
    );
    
    -- Credit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_unearned_revenue_id, v_description, 0, NEW.total_amount, v_reference_number, CURRENT_DATE
    );
    
  -- Handle UPDATE (payment status change)
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status = 'unpaid' AND NEW.payment_status = 'paid' THEN
    -- CRITICAL FIX: Always set v_entry_type to a valid value from the constraint
    v_entry_type := 'PAYMENT_RECEIVED';
    
    -- Create journal entry for payment received
    v_description := 'Payment received for ' || COALESCE(v_vehicle_name, 'vehicle') || ' booking';
    
    -- Insert journal entry header
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_entry_type, v_description, NEW.total_amount, v_reference_number, CURRENT_DATE
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries
    -- Debit Cash
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_cash_account_id, v_description, NEW.total_amount, 0, v_reference_number, CURRENT_DATE
    );
    
    -- Credit Accounts Receivable
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_ar_account_id, v_description, 0, NEW.total_amount, v_reference_number, CURRENT_DATE
    );
    
    -- Debit Unearned Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_unearned_revenue_id, v_description, NEW.total_amount, 0, v_reference_number, CURRENT_DATE
    );
    
    -- Credit Revenue
    INSERT INTO general_ledger (
      transaction_date, booking_id, account_id, description, debit, credit, reference_number, date
    ) VALUES (
      CURRENT_DATE, NEW.id, v_revenue_account_id, v_description, 0, NEW.total_amount, v_reference_number, CURRENT_DATE
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
