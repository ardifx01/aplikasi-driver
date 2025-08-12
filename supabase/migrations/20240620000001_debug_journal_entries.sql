-- Add debug logging for journal entries and ensure services_id is UUID type

-- First, ensure services_id is UUID type
DO $$
BEGIN
  -- Check if services_id column exists and is not UUID type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'services_id' 
    AND data_type <> 'uuid'
  ) THEN
    -- Change the column type to UUID
    ALTER TABLE bookings ALTER COLUMN services_id TYPE UUID USING services_id::UUID;
  END IF;
END
$$;

-- Create a function to log journal entry creation
CREATE OR REPLACE FUNCTION log_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the journal entry creation
  RAISE NOTICE 'Journal entry created: ID=%, Type=%, Amount=%', 
    NEW.id, 
    NEW.entry_type, 
    NEW.total_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to log journal entry creation
DROP TRIGGER IF EXISTS log_journal_entry_trigger ON journal_entries;
CREATE TRIGGER log_journal_entry_trigger
AFTER INSERT
ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION log_journal_entry();

-- Create a function to check if a booking has journal entries
CREATE OR REPLACE FUNCTION check_booking_journal_entries(booking_id UUID)
RETURNS TABLE (has_entries BOOLEAN, entry_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM journal_entries WHERE booking_id = $1;
  RETURN QUERY SELECT v_count > 0, v_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to manually create journal entries for a booking if missing
CREATE OR REPLACE FUNCTION create_missing_journal_entry(p_booking_id UUID)
RETURNS UUID AS $$
DECLARE
  v_journal_entry_id UUID;
  v_ar_account_id UUID := 'c6774ca8-7b22-4db3-b70e-538959f44aca'; -- For debit side
  v_unearned_revenue_id UUID := '60ec9e54-32fc-49de-acf4-04e5980198e1'; -- For credit side
  v_booking RECORD;
  v_reference_number VARCHAR(50);
  v_description TEXT;
  v_entry_type VARCHAR(50) := 'BOOKING_CREATED_MANUAL';
BEGIN
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking with ID % not found', p_booking_id;
  END IF;
  
  -- Generate reference number
  v_reference_number := 'BK-MANUAL-' || p_booking_id;
  
  -- Create description
  v_description := 'Manually created journal entry for booking ' || 
    COALESCE(v_booking.vehicle_name, 'unknown vehicle');
  
  -- Insert journal entry header
  INSERT INTO journal_entries (
    entry_date, booking_id, entry_type, description, total_amount, reference_number
  ) VALUES (
    CURRENT_DATE, p_booking_id, v_entry_type, v_description, v_booking.total_amount, v_reference_number
  ) RETURNING id INTO v_journal_entry_id;
  
  -- Insert general ledger entries
  -- Debit Accounts Receivable
  INSERT INTO general_ledger (
    transaction_date, booking_id, account_id, description, debit, credit, reference_number
  ) VALUES (
    CURRENT_DATE, p_booking_id, v_ar_account_id, v_description, v_booking.total_amount, 0, v_reference_number
  );
  
  -- Credit Unearned Revenue
  INSERT INTO general_ledger (
    transaction_date, booking_id, account_id, description, debit, credit, reference_number
  ) VALUES (
    CURRENT_DATE, p_booking_id, v_unearned_revenue_id, v_description, 0, v_booking.total_amount, v_reference_number
  );
  
  RETURN v_journal_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Ensure the booking_journal_entries_trigger is properly set up
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();

-- Add realtime for journal_entries and general_ledger if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'journal_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'general_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE general_ledger;
  END IF;
END
$$;