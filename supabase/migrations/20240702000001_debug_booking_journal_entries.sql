-- Debug and fix booking journal entries issue

-- First, drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;

-- Drop existing function
DROP FUNCTION IF EXISTS create_booking_journal_entries;

-- Create a debug table to log function execution
CREATE TABLE IF NOT EXISTS debug_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT,
  data JSONB
);

-- Create improved function with debug logging
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
  v_current_date DATE;
  v_debug_data JSONB;
BEGIN
  -- Log function entry
  INSERT INTO debug_log(message, data) 
  VALUES ('Function create_booking_journal_entries started', jsonb_build_object('trigger_op', TG_OP, 'booking_id', NEW.id));
  
  -- Set current date
  v_current_date := CURRENT_DATE;
  
  -- Get account IDs
  BEGIN
    SELECT id INTO v_cash_account_id FROM chart_of_accounts WHERE account_code = '1-10001';
    SELECT id INTO v_ar_account_id FROM chart_of_accounts WHERE account_code = '1-10002';
    SELECT id INTO v_revenue_account_id FROM chart_of_accounts WHERE account_code = '4-40001';
    SELECT id INTO v_unearned_revenue_id FROM chart_of_accounts WHERE account_code = '2-20001';
    
    -- Use hardcoded IDs as requested (cast to UUID)
    v_ar_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca'::UUID; -- For debit side
    v_unearned_revenue_id := '60ec9e54-32fc-49de-acf4-04e5980198e1'::UUID; -- For credit side
    
    -- Log account IDs
    v_debug_data := jsonb_build_object(
      'cash_account_id', v_cash_account_id,
      'ar_account_id', v_ar_account_id,
      'revenue_account_id', v_revenue_account_id,
      'unearned_revenue_id', v_unearned_revenue_id
    );
    INSERT INTO debug_log(message, data) VALUES ('Account IDs retrieved', v_debug_data);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO debug_log(message, data) VALUES ('Error getting account IDs', jsonb_build_object('error', SQLERRM));
    RAISE;
  END;
  
  -- Get vehicle name for better description
  DECLARE v_vehicle_name TEXT;
  BEGIN
    SELECT vehicle_name INTO v_vehicle_name FROM bookings WHERE id = NEW.id;
    IF v_vehicle_name IS NULL THEN
      v_vehicle_name := 'unknown vehicle';
    END IF;
    INSERT INTO debug_log(message, data) VALUES ('Vehicle name retrieved', jsonb_build_object('vehicle_name', v_vehicle_name));
  EXCEPTION WHEN OTHERS THEN
    v_vehicle_name := 'unknown vehicle';
    INSERT INTO debug_log(message, data) VALUES ('Error getting vehicle name', jsonb_build_object('error', SQLERRM));
  END;
  
  -- Generate reference number
  v_reference_number := 'BK-' || NEW.id::TEXT;
  
  -- Handle INSERT (new booking)
  IF TG_OP = 'INSERT' THEN
    BEGIN
      -- Create journal entry for new booking (unpaid)
      v_description := 'Booking created for ' || v_vehicle_name || ' (Unpaid)';
      
      INSERT INTO debug_log(message, data) VALUES ('Attempting to insert journal entry', 
        jsonb_build_object(
          'entry_date', v_current_date, 
          'booking_id', NEW.id, 
          'entry_type', 'BOOKING_CREATED', 
          'description', v_description, 
          'total_amount', COALESCE(NEW.total_amount, 0)
        )
      );
      
      -- Insert journal entry header with explicit values for all required columns
      INSERT INTO journal_entries (
        entry_date, 
        booking_id, 
        entry_type, 
        description, 
        total_amount, 
        reference_number, 
        date
      ) VALUES (
        v_current_date, 
        NEW.id, 
        'BOOKING_CREATED', 
        v_description, 
        COALESCE(NEW.total_amount, 0), 
        v_reference_number, 
        v_current_date
      ) RETURNING id INTO v_journal_entry_id;
      
      INSERT INTO debug_log(message, data) VALUES ('Journal entry inserted successfully', 
        jsonb_build_object('journal_entry_id', v_journal_entry_id)
      );
      
      -- Insert general ledger entries
      -- Debit Accounts Receivable
      INSERT INTO general_ledger (
        transaction_date, 
        booking_id, 
        account_id, 
        description, 
        debit, 
        credit, 
        reference_number, 
        date
      ) VALUES (
        v_current_date, 
        NEW.id, 
        v_ar_account_id, 
        v_description, 
        COALESCE(NEW.total_amount, 0), 
        0, 
        v_reference_number, 
        v_current_date
      );
      
      -- Credit Unearned Revenue
      INSERT INTO general_ledger (
        transaction_date, 
        booking_id, 
        account_id, 
        description, 
        debit, 
        credit, 
        reference_number, 
        date
      ) VALUES (
        v_current_date, 
        NEW.id, 
        v_unearned_revenue_id, 
        v_description, 
        0, 
        COALESCE(NEW.total_amount, 0), 
        v_reference_number, 
        v_current_date
      );
      
      INSERT INTO debug_log(message, data) VALUES ('General ledger entries inserted successfully', 
        jsonb_build_object('booking_id', NEW.id)
      );
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO debug_log(message, data) VALUES ('Error in INSERT handling', 
        jsonb_build_object('error', SQLERRM, 'booking_id', NEW.id)
      );
      RAISE;
    END;
  -- Handle UPDATE (payment status change)
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO debug_log(message, data) VALUES ('Processing UPDATE operation', 
      jsonb_build_object(
        'old_payment_status', OLD.payment_status,
        'new_payment_status', NEW.payment_status
      )
    );
    
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'paid' THEN
      BEGIN
        -- Create journal entry for payment received
        v_description := 'Payment received for ' || v_vehicle_name || ' booking';
        
        INSERT INTO debug_log(message, data) VALUES ('Attempting to insert payment journal entry', 
          jsonb_build_object(
            'entry_date', v_current_date, 
            'booking_id', NEW.id, 
            'entry_type', 'PAYMENT_RECEIVED', 
            'description', v_description, 
            'total_amount', COALESCE(NEW.total_amount, 0)
          )
        );
        
        -- Insert journal entry header with explicit values for all required columns
        INSERT INTO journal_entries (
          entry_date, 
          booking_id, 
          entry_type, 
          description, 
          total_amount, 
          reference_number, 
          date
        ) VALUES (
          v_current_date, 
          NEW.id, 
          'PAYMENT_RECEIVED', 
          v_description, 
          COALESCE(NEW.total_amount, 0), 
          v_reference_number, 
          v_current_date
        ) RETURNING id INTO v_journal_entry_id;
        
        INSERT INTO debug_log(message, data) VALUES ('Payment journal entry inserted successfully', 
          jsonb_build_object('journal_entry_id', v_journal_entry_id)
        );
        
        -- Insert general ledger entries
        -- Debit Cash
        INSERT INTO general_ledger (
          transaction_date, 
          booking_id, 
          account_id, 
          description, 
          debit, 
          credit, 
          reference_number, 
          date
        ) VALUES (
          v_current_date, 
          NEW.id, 
          v_cash_account_id, 
          v_description, 
          COALESCE(NEW.total_amount, 0), 
          0, 
          v_reference_number, 
          v_current_date
        );
        
        -- Credit Accounts Receivable
        INSERT INTO general_ledger (
          transaction_date, 
          booking_id, 
          account_id, 
          description, 
          debit, 
          credit, 
          reference_number, 
          date
        ) VALUES (
          v_current_date, 
          NEW.id, 
          v_ar_account_id, 
          v_description, 
          0, 
          COALESCE(NEW.total_amount, 0), 
          v_reference_number, 
          v_current_date
        );
        
        -- Debit Unearned Revenue
        INSERT INTO general_ledger (
          transaction_date, 
          booking_id, 
          account_id, 
          description, 
          debit, 
          credit, 
          reference_number, 
          date
        ) VALUES (
          v_current_date, 
          NEW.id, 
          v_unearned_revenue_id, 
          v_description, 
          COALESCE(NEW.total_amount, 0), 
          0, 
          v_reference_number, 
          v_current_date
        );
        
        -- Credit Revenue
        INSERT INTO general_ledger (
          transaction_date, 
          booking_id, 
          account_id, 
          description, 
          debit, 
          credit, 
          reference_number, 
          date
        ) VALUES (
          v_current_date, 
          NEW.id, 
          v_revenue_account_id, 
          v_description, 
          0, 
          COALESCE(NEW.total_amount, 0), 
          v_reference_number, 
          v_current_date
        );
        
        INSERT INTO debug_log(message, data) VALUES ('Payment general ledger entries inserted successfully', 
          jsonb_build_object('booking_id', NEW.id)
        );
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO debug_log(message, data) VALUES ('Error in payment UPDATE handling', 
          jsonb_build_object('error', SQLERRM, 'booking_id', NEW.id)
        );
        RAISE;
      END;
    END IF;
  END IF;
  
  INSERT INTO debug_log(message, data) VALUES ('Function create_booking_journal_entries completed successfully', 
    jsonb_build_object('booking_id', NEW.id)
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error and continue
  INSERT INTO debug_log(message, data) VALUES ('Unhandled error in create_booking_journal_entries', 
    jsonb_build_object('error', SQLERRM, 'booking_id', COALESCE(NEW.id, NULL))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger with AFTER INSERT OR UPDATE
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();

-- Create a function to manually create journal entries for existing bookings
CREATE OR REPLACE FUNCTION create_journal_entry_for_booking(p_booking_id UUID)
RETURNS UUID AS $$
DECLARE
  v_booking RECORD;
  v_result RECORD;
BEGIN
  -- Get the booking record
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking with ID % not found', p_booking_id;
  END IF;
  
  -- Call the trigger function manually
  SELECT create_booking_journal_entries() INTO v_result
  FROM (SELECT v_booking.* AS NEW, NULL AS OLD) AS trigger_data;
  
  -- Return the booking ID to indicate success
  RETURN p_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a booking has journal entries
CREATE OR REPLACE FUNCTION check_booking_journal_entries(p_booking_id UUID)
RETURNS TABLE (has_entries BOOLEAN, entry_count INTEGER, journal_ids UUID[]) AS $$
DECLARE
  v_count INTEGER;
  v_ids UUID[];
BEGIN
  SELECT COUNT(*), ARRAY_AGG(id) 
  INTO v_count, v_ids 
  FROM journal_entries 
  WHERE booking_id = p_booking_id;
  
  RETURN QUERY SELECT 
    COALESCE(v_count, 0) > 0, 
    COALESCE(v_count, 0), 
    v_ids;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS fix_missing_journal_entries();

-- Create a function to fix all bookings without journal entries
CREATE OR REPLACE FUNCTION fix_missing_journal_entries()
RETURNS TABLE (booking_id UUID, status TEXT) AS $$
DECLARE
  v_booking RECORD;
  v_has_entries BOOLEAN;
  v_entry_count INTEGER;
  v_journal_ids UUID[];
BEGIN
  FOR v_booking IN 
    SELECT id FROM bookings
    ORDER BY created_at DESC
    LIMIT 100
  LOOP
    SELECT * FROM check_booking_journal_entries(v_booking.id) 
    INTO v_has_entries, v_entry_count, v_journal_ids;
    
    IF NOT v_has_entries THEN
      BEGIN
        PERFORM create_journal_entry_for_booking(v_booking.id);
        booking_id := v_booking.id;
        status := 'FIXED';
        RETURN NEXT;
      EXCEPTION WHEN OTHERS THEN
        booking_id := v_booking.id;
        status := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a view to easily check debug logs
CREATE OR REPLACE VIEW debug_log_view AS
SELECT 
  id,
  timestamp,
  message,
  data
FROM debug_log
ORDER BY id DESC;

-- Create a view to check journal entries and their related bookings
CREATE OR REPLACE VIEW journal_entries_with_bookings AS
SELECT 
  je.id AS journal_entry_id,
  je.entry_date,
  je.entry_type,
  je.description,
  je.total_amount,
  je.reference_number,
  b.id AS booking_id,
  b.vehicle_name,
  b.total_amount AS booking_amount,
  b.payment_status,
  b.created_at AS booking_created_at
FROM journal_entries je
LEFT JOIN bookings b ON je.booking_id = b.id
ORDER BY je.entry_date DESC, je.id DESC;