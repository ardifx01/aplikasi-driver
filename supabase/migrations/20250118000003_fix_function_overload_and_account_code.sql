-- Remove all trial_balance dependencies and functions
-- This migration removes the connection to trial_balance table

-- Drop all existing trial_balance related functions
DROP FUNCTION IF EXISTS upsert_trial_balance(text);
DROP FUNCTION IF EXISTS upsert_trial_balances(json);
DROP FUNCTION IF EXISTS upsert_trial_balances(text, text, numeric);
DROP FUNCTION IF EXISTS refresh_trial_balance();
DROP FUNCTION IF EXISTS upsert_trial_balance_for_period(text);
DROP FUNCTION IF EXISTS upsert_trial_balance_from_json(json);
DROP FUNCTION IF EXISTS upsert_trial_balance_entry(text, text, numeric);
DROP FUNCTION IF EXISTS refresh_current_trial_balance();

-- Create simplified booking journal entry function without trial_balance dependencies
CREATE OR REPLACE FUNCTION create_booking_journal_entries()
RETURNS TRIGGER AS $
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
  -- Get account IDs from chart_of_accounts
  SELECT id INTO v_cash_account_id FROM chart_of_accounts WHERE account_code = '1-10001';
  SELECT id INTO v_ar_account_id FROM chart_of_accounts WHERE account_code = '1-10002';
  SELECT id INTO v_revenue_account_id FROM chart_of_accounts WHERE account_code = '4-40001';
  SELECT id INTO v_unearned_revenue_id FROM chart_of_accounts WHERE account_code = '2-20001';
  
  -- Use fallback account IDs if not found in chart_of_accounts
  IF v_ar_account_id IS NULL THEN
    v_ar_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca';
  END IF;
  
  IF v_unearned_revenue_id IS NULL THEN
    v_unearned_revenue_id := '60ec9e54-32fc-49de-acf4-04e5980198e1';
  END IF;
  
  IF v_cash_account_id IS NULL THEN
    v_cash_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca';
  END IF;
  
  IF v_revenue_account_id IS NULL THEN
    v_revenue_account_id := '60ec9e54-32fc-49de-acf4-04e5980198e1';
  END IF;
  
  -- Get vehicle name for better description
  v_vehicle_name := COALESCE(NEW.vehicle_name, 'unknown vehicle');
  
  -- Generate reference number
  v_reference_number := 'BK-' || NEW.id;
  
  -- Handle INSERT (new booking)
  IF TG_OP = 'INSERT' THEN
    -- Create journal entry for new booking (unpaid)
    v_description := 'Booking created for ' || v_vehicle_name || ' (Unpaid)';
    v_entry_type := 'BOOKING_CREATED';
    
    -- Insert journal entry header
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_entry_type, v_description, NEW.total_amount, v_reference_number
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Update the booking with the journal_entry_id
    UPDATE bookings SET journal_entry_id = v_journal_entry_id WHERE id = NEW.id;
    
    -- Insert general ledger entries with proper date column
    -- Debit Accounts Receivable
    INSERT INTO general_ledger (
      date, transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, CURRENT_DATE, NEW.id, v_ar_account_id, v_description, NEW.total_amount, 0, v_reference_number
    );
    
    -- Credit Unearned Revenue
    INSERT INTO general_ledger (
      date, transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, CURRENT_DATE, NEW.id, v_unearned_revenue_id, v_description, 0, NEW.total_amount, v_reference_number
    );
    
  -- Handle UPDATE (payment status change)
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status = 'unpaid' AND NEW.payment_status = 'paid' THEN
    -- Create journal entry for payment received
    v_description := 'Payment received for ' || v_vehicle_name || ' booking';
    v_entry_type := 'PAYMENT_RECEIVED';
    
    -- Insert journal entry header
    INSERT INTO journal_entries (
      entry_date, booking_id, entry_type, description, total_amount, reference_number
    ) VALUES (
      CURRENT_DATE, NEW.id, v_entry_type, v_description, NEW.total_amount, v_reference_number
    ) RETURNING id INTO v_journal_entry_id;
    
    -- Insert general ledger entries with proper date column
    -- Debit Cash
    INSERT INTO general_ledger (
      date, transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, CURRENT_DATE, NEW.id, v_cash_account_id, v_description, NEW.total_amount, 0, v_reference_number
    );
    
    -- Credit Accounts Receivable
    INSERT INTO general_ledger (
      date, transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, CURRENT_DATE, NEW.id, v_ar_account_id, v_description, 0, NEW.total_amount, v_reference_number
    );
    
    -- Debit Unearned Revenue
    INSERT INTO general_ledger (
      date, transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, CURRENT_DATE, NEW.id, v_unearned_revenue_id, v_description, NEW.total_amount, 0, v_reference_number
    );
    
    -- Credit Revenue
    INSERT INTO general_ledger (
      date, transaction_date, booking_id, account_id, description, debit, credit, reference_number
    ) VALUES (
      CURRENT_DATE, CURRENT_DATE, NEW.id, v_revenue_account_id, v_description, 0, NEW.total_amount, v_reference_number
    );
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();
