-- Fix the trial_balance account_code null constraint violation
-- This migration ensures that all functions properly populate account_code when inserting into trial_balance

-- First, let's check if there are any existing null account_code entries and fix them
UPDATE trial_balance 
SET account_code = COALESCE(
  (SELECT account_code FROM chart_of_accounts WHERE id = trial_balance.account_id),
  'UNKNOWN'
)
WHERE account_code IS NULL;

-- Create or replace the function that populates trial balance to ensure account_code is always set
CREATE OR REPLACE FUNCTION upsert_trial_balance(p_period text)
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Delete existing entries for the period
  DELETE FROM trial_balance WHERE period = p_period;
  
  -- Insert new trial balance entries with proper account_code
  INSERT INTO trial_balance (
    account_code,
    account_id,
    account_name,
    period,
    amount,
    total_debit,
    total_credit,
    period_start,
    period_end
  )
  SELECT 
    coa.account_code,
    coa.id,
    coa.account_name,
    p_period,
    COALESCE(SUM(gl.debit - gl.credit), 0) as amount,
    COALESCE(SUM(gl.debit), 0) as total_debit,
    COALESCE(SUM(gl.credit), 0) as total_credit,
    (p_period || '-01')::date as period_start,
    (date_trunc('month', (p_period || '-01')::date) + interval '1 month - 1 day')::date as period_end
  FROM chart_of_accounts coa
  LEFT JOIN general_ledger gl ON gl.account_id = coa.id 
    AND date_trunc('month', gl.date::date) = (p_period || '-01')::date
  WHERE coa.account_code IS NOT NULL
  GROUP BY coa.id, coa.account_code, coa.account_name
  ORDER BY coa.account_code;
  
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function that handles trial balance upserts with JSON payload
CREATE OR REPLACE FUNCTION upsert_trial_balances(payload json)
RETURNS void AS $$
DECLARE
  item json;
  v_account_code text;
  v_account_id uuid;
  v_period text;
  v_amount numeric;
BEGIN
  FOR item IN SELECT * FROM json_array_elements(payload)
  LOOP
    v_account_code := item->>'account_code';
    v_account_id := (item->>'account_id')::uuid;
    v_period := item->>'period';
    v_amount := (item->>'amount')::numeric;
    
    -- Ensure account_code is not null
    IF v_account_code IS NULL AND v_account_id IS NOT NULL THEN
      SELECT account_code INTO v_account_code 
      FROM chart_of_accounts 
      WHERE id = v_account_id;
    END IF;
    
    -- Skip if we still don't have an account_code
    IF v_account_code IS NULL THEN
      CONTINUE;
    END IF;
    
    INSERT INTO trial_balance (
      account_code,
      account_id,
      account_name,
      period,
      amount,
      total_amount
    )
    VALUES (
      v_account_code,
      v_account_id,
      (SELECT account_name FROM chart_of_accounts WHERE id = v_account_id),
      v_period,
      v_amount,
      v_amount
    )
    ON CONFLICT (account_code, period) 
    DO UPDATE SET
      amount = EXCLUDED.amount,
      total_amount = EXCLUDED.total_amount,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function that handles individual trial balance upserts
CREATE OR REPLACE FUNCTION upsert_trial_balances(
  p_account_code text,
  p_period text,
  p_amount numeric
)
RETURNS void AS $$
DECLARE
  v_account_id uuid;
  v_account_name text;
BEGIN
  -- Get account details
  SELECT id, account_name INTO v_account_id, v_account_name
  FROM chart_of_accounts
  WHERE account_code = p_account_code;
  
  -- Only proceed if we found the account
  IF v_account_id IS NOT NULL THEN
    INSERT INTO trial_balance (
      account_code,
      account_id,
      account_name,
      period,
      amount,
      total_amount
    )
    VALUES (
      p_account_code,
      v_account_id,
      v_account_name,
      p_period,
      p_amount,
      p_amount
    )
    ON CONFLICT (account_code, period) 
    DO UPDATE SET
      amount = EXCLUDED.amount,
      total_amount = EXCLUDED.total_amount,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to refresh trial balance for current period
CREATE OR REPLACE FUNCTION refresh_trial_balance()
RETURNS void AS $$
DECLARE
  current_period text;
BEGIN
  -- Get current period in YYYY-MM format
  current_period := to_char(CURRENT_DATE, 'YYYY-MM');
  
  -- Refresh trial balance for current period
  PERFORM upsert_trial_balance(current_period);
END;
$$ LANGUAGE plpgsql;

-- Update the booking journal entry creation function to avoid trial_balance issues
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
    v_description := 'Payment received for ' || COALESCE(v_vehicle_name, 'vehicle') || ' booking';
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
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION upsert_trial_balance TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_trial_balances TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_trial_balance TO authenticated;
